import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { handleToolCall } from "@/lib/ai/toolHandlers";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function sseLine(event: string, data: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { message?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const message = body.message?.trim();
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });

  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  if (!assistantId) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_ASSISTANT_ID not configured" },
      { status: 500 }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(sseLine("status", { step: "init" }));

        const { data: existing } = await supabase
          .from("ai_threads")
          .select("thread_id")
          .eq("user_id", user.id)
          .maybeSingle();

        let threadId = existing?.thread_id;

        if (!threadId) {
          const thread = await openai.beta.threads.create();
          threadId = thread.id;
          await supabase.from("ai_threads").upsert({
            user_id: user.id,
            thread_id: threadId,
            updated_at: new Date().toISOString(),
          });
        }

        controller.enqueue(
          sseLine("status", { step: "thread_ready", threadId })
        );

        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: message,
        });

        controller.enqueue(sseLine("status", { step: "run_start" }));

        let run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: assistantId,
        });

        while (true) {
          if (run.status === "completed") break;
          if (run.status === "failed" || run.status === "cancelled" || run.status === "expired") {
            controller.enqueue(
              sseLine("error", {
                status: run.status,
                message: (run as { last_error?: { message?: string } }).last_error?.message ?? run.status,
              })
            );
            controller.close();
            return;
          }
          if (run.status === "requires_action") {
            const toolCalls =
              (run.required_action as { submit_tool_outputs?: { tool_calls?: Array<{ id: string; function: { name: string; arguments?: string } }> } })
                ?.submit_tool_outputs?.tool_calls ?? [];

            controller.enqueue(
              sseLine("status", { step: "tools", count: toolCalls.length })
            );

            const outputs: Array<{ tool_call_id: string; output: string }> = [];
            for (const tc of toolCalls) {
              const name = tc.function.name;
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(tc.function.arguments || "{}");
              } catch {
                args = {};
              }
              controller.enqueue(sseLine("tool_call", { name, args }));
              const result = await handleToolCall(supabase, name, args);
              outputs.push({
                tool_call_id: tc.id,
                output: JSON.stringify(result),
              });
            }

            run = await openai.beta.threads.runs.submitToolOutputs(run.id, {
              thread_id: threadId,
              tool_outputs: outputs,
            });
            continue;
          }

          await sleep(800);
          run = await openai.beta.threads.runs.retrieve(run.id, {
              thread_id: threadId,
            });
        }

        const msgs = await openai.beta.threads.messages.list(threadId, {
          limit: 1,
        });
        const last = msgs.data?.[0];
        const text =
          last?.content?.[0]?.type === "text"
            ? (last.content[0] as { text: { value: string } }).text.value
            : "Ok.";

        controller.enqueue(sseLine("message", { text }));
        controller.enqueue(sseLine("done", { ok: true }));
        controller.close();
      } catch (e: unknown) {
        const err = e as { message?: string };
        controller.enqueue(
          sseLine("error", { message: err?.message || "Erro" })
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
