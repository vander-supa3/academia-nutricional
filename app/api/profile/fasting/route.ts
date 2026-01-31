import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const fasting_style = (body.fasting_style ?? "nao") as string;
  const fasting_days_per_week =
    fasting_style === "planejado"
      ? Math.min(7, Math.max(0, Number(body.fasting_days_per_week ?? 0)))
      : 0;
  const fasting_window =
    fasting_style === "planejado" && body.fasting_window
      ? String(body.fasting_window)
      : null;
  const fasting_notes =
    body.fasting_notes != null ? String(body.fasting_notes).slice(0, 500) : "";

  const { error } = await supabase
    .from("profiles")
    .update({
      fasting_enabled: !!body.fasting_enabled,
      fasting_style: ["nao", "ocasional", "planejado"].includes(fasting_style)
        ? fasting_style
        : "nao",
      fasting_days_per_week,
      fasting_window,
      fasting_notes,
    })
    .eq("id", user.id);

  if (error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  return NextResponse.json({ ok: true });
}
