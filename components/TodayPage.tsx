"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureUserSeed } from "@/lib/ensureSeed";
import { toast } from "sonner";
import { offlineUpsertDailyLog } from "@/lib/offline/mutations";
import { Badge } from "@/components/ui/Badge";

type Plan = {
  id: string;
  day_index: number;
  title: string;
  workout_title: string;
  workout_minutes: number;
  water_goal_ml: number;
  kcal_min: number | null;
  kcal_max: number | null;
};

type PlanMeal = {
  id: string;
  plan_id: string;
  meal_type: string;
  recipe_title: string;
  kcal: number | null;
  order_index: number;
};

export function TodayPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [meals, setMeals] = useState<PlanMeal[]>([]);
  const [water, setWater] = useState({ current: 1200, goal: 2500 });
  const [progress, setProgress] = useState({ streak: 5, weeklyDelta: "-1,2 kg" });
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [fastingEnabled, setFastingEnabled] = useState(false);
  const [fastingToday, setFastingToday] = useState(false);

  const todayIndex = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    return day === 0 ? 7 : day;
  }, []);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setPlan(null);
      setMeals([]);
      return;
    }

    const { data: p, error: planError } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_index", todayIndex)
      .maybeSingle();

    if (planError) console.error("[TodayPage] daily_plans:", planError);

    if (p) {
      setPlan(p as Plan);
      setWater((w) => ({ ...w, goal: (p as Plan).water_goal_ml }));

      const { data: pm, error: mealsError } = await supabase
        .from("plan_meals")
        .select("*")
        .eq("plan_id", (p as Plan).id)
        .order("order_index", { ascending: true });

      if (mealsError) console.error("[TodayPage] plan_meals:", mealsError);
      setMeals((pm ?? []) as PlanMeal[]);
    }
    if (!p) {
      setPlan(null);
      setMeals([]);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: log } = await supabase
      .from("daily_logs")
      .select("water_ml, fasting_today")
      .eq("user_id", user.id)
      .eq("date", todayStr)
      .maybeSingle();
    if (log?.water_ml != null) {
      setWater((w) => ({ ...w, current: log.water_ml }));
    }
    if (log?.fasting_today != null) {
      setFastingToday(!!log.fasting_today);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("fasting_enabled")
      .eq("id", user.id)
      .maybeSingle();
    setFastingEnabled(!!profile?.fasting_enabled);

    setLoading(false);
  }, [todayIndex]);

  const today = new Date().toISOString().slice(0, 10);

  async function saveFastingToday(value: boolean) {
    const online = typeof navigator !== "undefined" && navigator.onLine;
    if (!online) {
      await offlineUpsertDailyLog({ date: today, fasting_today: value });
      setFastingToday(value);
      toast.success("Salvo offline. Sincroniza quando voltar a conexão.");
      return;
    }
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) return;
    const { data: existing } = await supabase
      .from("daily_logs")
      .select("water_ml, workout_done, meals_logged, weight_kg")
      .eq("user_id", u.id)
      .eq("date", today)
      .maybeSingle();
    const payload = {
      user_id: u.id,
      date: today,
      ...(existing ?? {}),
      fasting_today: value,
    };
    const { error } = await supabase.from("daily_logs").upsert(payload, {
      onConflict: "user_id,date",
    });
    if (!error) {
      setFastingToday(value);
    } else {
      toast.error("Erro ao salvar.");
    }
  }

  async function saveWater(water_ml: number) {
    const online = typeof navigator !== "undefined" && navigator.onLine;
    if (!online) {
      await offlineUpsertDailyLog({ date: today, water_ml });
      setWater((w) => ({ ...w, current: water_ml }));
      toast.success("Salvo offline. Sincroniza quando voltar a conexão.");
      return;
    }
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) return;
    const { error } = await supabase.from("daily_logs").upsert(
      { user_id: u.id, date: today, water_ml },
      { onConflict: "user_id,date" }
    );
    if (!error) {
      setWater((w) => ({ ...w, current: water_ml }));
    } else {
      toast.error("Erro ao salvar.");
    }
  }

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  async function handleSeedNow() {
    setSeedLoading(true);
    try {
      await ensureUserSeed();
      await fetchToday();
      toast.success("Plano gerado! Atualize a página se não aparecer.");
    } catch (e) {
      console.error("[TodayPage] handleSeedNow:", e);
      toast.error("Erro ao gerar plano. Tente de novo.");
    } finally {
      setSeedLoading(false);
    }
  }

  if (loading && !plan) {
    return (
      <div className="space-y-4">
        <div className="border border-border rounded-xl shadow-sm p-4 animate-pulse">
          <div className="h-4 bg-zinc-200 rounded w-1/3" />
          <div className="h-5 bg-zinc-200 rounded w-2/3 mt-2" />
        </div>
        <div className="border border-border rounded-xl shadow-sm p-4 animate-pulse">
          <div className="h-4 bg-zinc-200 rounded w-1/4" />
          <div className="h-3 bg-zinc-200 rounded w-full mt-3" />
          <div className="h-3 bg-zinc-200 rounded w-2/3 mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="border border-border rounded-xl shadow-sm p-4 transition duration-250">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-zinc-500">📋 Plano de hoje</span>
          {fastingEnabled && (
            <Badge tone="warning" className="text-[10px]">Jejum opcional</Badge>
          )}
        </div>
        {loading ? (
          <div className="mt-1 font-semibold">Carregando...</div>
        ) : plan ? (
          <>
            <div className="mt-1 font-semibold">{plan.workout_title}</div>
            <div className="text-sm text-zinc-600 mt-1">⏱️ {plan.workout_minutes} min</div>
          </>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="text-sm text-zinc-600">
              Ainda não geramos seu plano inicial.
            </div>
            <button
              onClick={handleSeedNow}
              disabled={seedLoading}
              className="w-full bg-primary-500 text-white py-3 rounded-xl shadow-sm transition duration-250 disabled:opacity-50 font-medium"
            >
              {seedLoading ? "Gerando plano..." : "Gerar plano agora"}
            </button>
          </div>
        )}
      </section>

      {fastingEnabled && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-center gap-2 text-sm text-amber-900/90">
            <span className="font-medium">Dia com jejum (opcional)</span>
          </div>
          <p className="mt-1 text-xs text-amber-800/80 leading-relaxed">
            Ao quebrar o jejum, priorize proteína, fibra e água. Este app não prescreve regime.
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-sm text-amber-900/90">Hoje fiz jejum</span>
            <button
              type="button"
              role="switch"
              aria-checked={fastingToday}
              onClick={() => saveFastingToday(!fastingToday)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                fastingToday ? "bg-amber-500" : "bg-zinc-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                  fastingToday ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </section>
      )}

      <section className="border border-border rounded-xl shadow-sm p-4">
        <div className="text-sm text-zinc-500">🍽️ Refeições</div>
        <div className="mt-2 space-y-2">
          {meals.length === 0 ? (
            <div className="text-sm text-zinc-600">
              {plan
                ? "Nenhuma refeição neste plano."
                : "Gere o plano acima para ver as refeições do dia."}
            </div>
          ) : (
            meals.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{m.meal_type}</div>
                  <div className="text-sm text-zinc-600">{m.recipe_title}</div>
                </div>
                <div className="text-sm text-zinc-500 whitespace-nowrap">
                  {m.kcal ? `${m.kcal} kcal` : ""}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          Total estimado: {plan?.kcal_min ?? 1800}–{plan?.kcal_max ?? 2200} kcal (ajustável)
        </div>
      </section>

      <section className="border border-border rounded-xl shadow-sm p-4">
        <div className="text-sm text-zinc-500">💧 Água</div>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-primary-500 transition-all duration-250"
              style={{ width: `${Math.min(100, (water.current / water.goal) * 100)}%` }}
            />
          </div>
          <div className="text-sm text-zinc-600">
            {(water.current / 1000).toFixed(1)}L / {(water.goal / 1000).toFixed(1)}L
          </div>
          <button
            type="button"
            onClick={() => saveWater(water.current + 250)}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-muted transition duration-250"
          >
            +250 ml
          </button>
        </div>
      </section>

      <section className="border border-border rounded-xl shadow-sm p-4">
        <div className="text-sm text-zinc-500">📈 Progresso</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm">
            <span className="bg-accent-100 text-zinc-900 px-2 py-1 rounded-xl border border-accent-300">
              Streak {progress.streak} dias
            </span>
          </div>
          <div className="text-sm text-zinc-600">{progress.weeklyDelta} esta semana</div>
        </div>
        <div className="mt-2 text-xs text-zinc-500 italic">
          Foque em consistência. Ajuste metas com segurança e, se possível, com orientação profissional.
        </div>
      </section>
    </div>
  );
}
