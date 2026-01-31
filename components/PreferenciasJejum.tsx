"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type FastingStyle = "nao" | "ocasional" | "planejado";

export function PreferenciasJejum() {
  const [style, setStyle] = useState<FastingStyle>("nao");
  const [days, setDays] = useState(0);
  const [window, setWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "fasting_enabled, fasting_style, fasting_days_per_week, fasting_window, fasting_notes"
        )
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        setStyle((profile.fasting_style as FastingStyle) ?? "nao");
        setDays(Number(profile.fasting_days_per_week ?? 0));
        setWindow(profile.fasting_window ?? "");
        setNotes(profile.fasting_notes ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/fasting", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fasting_enabled: style !== "nao",
          fasting_style: style,
          fasting_days_per_week: style === "planejado" ? days : 0,
          fasting_window: style === "planejado" ? window || null : null,
          fasting_notes: notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Não foi possível salvar suas preferências.");
        return;
      }
      toast.success("Preferências salvas.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="h-6 w-1/3 rounded bg-zinc-200 animate-pulse" />
          <div className="mt-3 h-4 w-full rounded bg-zinc-100 animate-pulse" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-500">
              Preferências alimentares
            </div>
            <div className="mt-1 font-semibold text-[15px]">
              Jejum (opcional)
            </div>
          </div>
          <Badge tone="warning">Opcional</Badge>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900/90 leading-relaxed">
          Este app não prescreve dietas. Se você tiver menos de 18 anos, estiver
          grávida(o) ou tiver qualquer condição de saúde, fale com um
          profissional antes de praticar jejum.
        </div>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="fast"
              className="border-border text-primary-500"
              checked={style === "nao"}
              onChange={() => setStyle("nao")}
            />
            Não pratico jejum
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="fast"
              className="border-border text-primary-500"
              checked={style === "ocasional"}
              onChange={() => setStyle("ocasional")}
            />
            Jejum ocasional (flexível)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="fast"
              className="border-border text-primary-500"
              checked={style === "planejado"}
              onChange={() => setStyle("planejado")}
            />
            Jejum planejado (dias por semana)
          </label>
        </div>

        {style === "planejado" && (
          <div className="space-y-3 rounded-2xl border border-border bg-zinc-50/80 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Dias por semana</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition"
                  onClick={() => setDays((d) => Math.max(0, d - 1))}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm tabular-nums">
                  {days}
                </span>
                <button
                  type="button"
                  className="rounded-xl border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition"
                  onClick={() => setDays((d) => Math.min(7, d + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Janela (opcional)</span>
              <select
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
                value={window}
                onChange={(e) => setWindow(e.target.value)}
              >
                <option value="">Não informar</option>
                <option value="12h">12h</option>
                <option value="14h">14h</option>
                <option value="16h">16h</option>
              </select>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <div className="text-sm text-zinc-600">
            Preferências (opcional)
          </div>
          <textarea
            className="w-full rounded-2xl border border-border bg-white p-3 text-sm placeholder:text-zinc-400"
            rows={3}
            placeholder="Ex.: refeições mais baratas, sem lactose, mais proteína..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </CardBody>
      <CardFooter>
        <Button
          className="w-full"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Salvando…" : "Salvar preferências"}
        </Button>
      </CardFooter>
    </Card>
  );
}
