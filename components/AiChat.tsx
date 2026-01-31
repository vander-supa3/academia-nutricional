"use client";

import { useRef, useState } from "react";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MessageCircle } from "lucide-react";

export function AiChat() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<
    Array<{ role: "user" | "ai"; text: string }>
  >([]);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setStatus("Enviando...");
    setSending(true);

    try {
      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus(`Erro: ${err?.error ?? res.statusText}`);
        setSending(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStatus("Resposta vazia.");
        setSending(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const p of parts) {
          const lines = p.split("\n");
          const ev = lines
            .find((l) => l.startsWith("event:"))
            ?.replace("event:", "")
            .trim();
          const dataLine = lines
            .find((l) => l.startsWith("data:"))
            ?.replace("data:", "")
            .trim();
          if (!ev || !dataLine) continue;

          try {
            const data = JSON.parse(dataLine) as Record<string, unknown>;

            if (ev === "status") {
              setStatus((data.step as string) ?? "");
            }
            if (ev === "message") {
              setMsgs((m) => [
                ...m,
                { role: "ai", text: (data.text as string) ?? "Ok." },
              ]);
              setStatus("");
            }
            if (ev === "error") {
              setStatus(
                `Erro: ${(data.message as string) ?? (data.status as string) ?? "Desconhecido"}`
              );
            }
            if (ev === "done") {
              setStatus("");
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }
    } finally {
      setSending(false);
      if (status.startsWith("Erro:")) {
        // keep error visible
      } else {
        setStatus("");
      }
    }
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <MessageCircle size={18} />
          Assistente
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {msgs.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">
              Ex.: &quot;Gere meu plano de hoje&quot;, &quot;Sugira um treino&quot;, &quot;Receitas baratas&quot;
            </p>
          ) : (
            msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "text-right"
                    : "text-left"
                }
              >
                <div
                  className={`inline-block max-w-[85%] rounded-2xl border px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "border-primary-200 bg-primary-50 text-primary-900"
                      : "border-border bg-muted/40 text-ink"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))
          )}
        </div>

        {status ? (
          <div className="text-xs text-zinc-500">⏳ {status}</div>
        ) : null}
      </CardBody>

      <CardFooter className="flex gap-2">
        <input
          className="flex-1 border border-border rounded-2xl px-3 py-2 text-sm bg-surface placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ex.: Gere meu plano de hoje, ou sugira um treino..."
          disabled={sending}
        />
        <Button onClick={send} disabled={sending || !input.trim()}>
          {sending ? "..." : "Enviar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
