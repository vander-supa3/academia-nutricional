"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureUserSeed } from "@/lib/ensureSeed";
import {
  getTodayPlan,
  getConsumedToday,
  getNote,
  saveNotes,
  swapMealItem,
  consumeMeal,
  unconsumeMeal,
  getSuggestionsForSwap,
  type UserMealPlanItem,
  type Anamnesis,
} from "@/lib/mealPlan";
import { ensureMealPlan } from "@/lib/ensureMealPlan";
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

const todayISO = () => new Date().toISOString().slice(0, 10);

export function TodayPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planMeals, setPlanMeals] = useState<PlanMeal[]>([]);
  const [mealPlanData, setMealPlanData] = useState<{
    plan: { id: string; calories_target: number; goal: string };
    items: UserMealPlanItem[];
  } | null>(null);
  const [consumed, setConsumed] = useState<{ totalKcal: number; consumedItemIds: string[] }>({
    totalKcal: 0,
    consumedItemIds: [],
  });
  const [todayNote, setTodayNote] = useState("");
  const [anamnesis, setAnamnesis] = useState<Anamnesis | null>(null);
  const [water, setWater] = useState({ current: 1200, goal: 2500 });
  const [progress, setProgress] = useState({ streak: 5, weeklyDelta: "-1,2 kg" });
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [fastingEnabled, setFastingEnabled] = useState(false);
  const [fastingToday, setFastingToday] = useState(false);
  const [swapItem, setSwapItem] = useState<UserMealPlanItem | null>(null);
  const [swapSuggestions, setSwapSuggestions] = useState<Array<{ id: string; title: string; kcal: number | null }>>([]);
  const [swapLoading, setSwapLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  const todayStr = useMemo(() => todayISO(), []);
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
      setPlanMeals([]);
      setMealPlanData(null);
      return;
    }

    const [planRes, mealPlanRes, consumedRes, noteContent, anamRes] = await Promise.all([
      supabase
        .from("daily_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("day_index", todayIndex)
        .maybeSingle(),
      getTodayPlan(supabase, user.id, todayStr),
      getConsumedToday(supabase, user.id, todayStr),
      getNote(supabase, user.id, todayStr),
      supabase.from("user_anamnesis").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    if (planRes.data) {
      setPlan(planRes.data as Plan);
      setWater((w) => ({ ...w, goal: (planRes.data as Plan).water_goal_ml }));
      const { data: pm } = await supabase
        .from("plan_meals")
        .select("*")
        .eq("plan_id", (planRes.data as Plan).id)
        .order("order_index", { ascending: true });
      setPlanMeals((pm ?? []) as PlanMeal[]);
    } else {
      setPlan(null);
      setPlanMeals([]);
    }

    if (mealPlanRes) setMealPlanData(mealPlanRes);
    else setMealPlanData(null);

    setConsumed({
      totalKcal: consumedRes.totalKcal,
      consumedItemIds: consumedRes.consumedItemIds,
    });
    setTodayNote(noteContent ?? "");
    if (anamRes.data) setAnamnesis(anamRes.data as Anamnesis);

    const todayStr2 = todayISO();
    const { data: log } = await supabase
      .from("daily_logs")
      .select("water_ml, fasting_today")
      .eq("user_id", user.id)
      .eq("date", todayStr2)
      .maybeSingle();
    if (log?.water_ml != null) setWater((w) => ({ ...w, current: log.water_ml }));
    if (log?.fasting_today != null) setFastingToday(!!log.fasting_today);

    const { data: profile } = await supabase
      .from("profiles")
      .select("fasting_enabled")
      .eq("id", user.id)
      .maybeSingle();
    setFastingEnabled(!!profile?.fasting_enabled);

    setLoading(false);
  }, [todayIndex, todayStr]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  async function saveFastingToday(value: boolean) {
    const online = typeof navigator !== "undefined" && navigator.onLine;
    if (!online) {
      await offlineUpsertDailyLog({ date: todayStr, fasting_today: value });
      setFastingToday(value);
      toast.success("Salvo offline. Sincroniza quando voltar a conexão.");
      return;
    }
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { data: existing } = await supabase
      .from("daily_logs")
      .select("water_ml, workout_done, meals_logged, weight_kg")
      .eq("user_id", u.id)
      .eq("date", todayStr)
      .maybeSingle();
    const payload = {
      user_id: u.id,
      date: todayStr,
      ...(existing ?? {}),
      fasting_today: value,
    };
    const { error } = await supabase.from("daily_logs").upsert(payload, {
      onConflict: "user_id,date",
    });
    if (!error) setFastingToday(value);
    else toast.error("Erro ao salvar.");
  }

  async function saveWater(water_ml: number) {
    const online = typeof navigator !== "undefined" && navigator.onLine;
    if (!online) {
      await offlineUpsertDailyLog({ date: todayStr, water_ml });
      setWater((w) => ({ ...w, current: water_ml }));
      toast.success("Salvo offline. Sincroniza quando voltar a conexão.");
      return;
    }
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const { error } = await supabase.from("daily_logs").upsert(
      { user_id: u.id, date: todayStr, water_ml },
      { onConflict: "user_id,date" }
    );
    if (!error) setWater((w) => ({ ...w, current: water_ml }));
    else toast.error("Erro ao salvar.");
  }

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

  async function handleGenerateMealPlan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSeedLoading(true);
    try {
      const { ok, error } = await ensureMealPlan(user.id);
      if (!ok) {
        toast.error(error ?? "Erro ao gerar plano.");
        return;
      }
      await fetchToday();
      toast.success("Plano alimentar gerado para 7 dias.");
    } catch (e) {
      console.error("[TodayPage] handleGenerateMealPlan:", e);
      toast.error("Erro ao gerar plano. Tente de novo.");
    } finally {
      setSeedLoading(false);
    }
  }

  async function openSwap(item: UserMealPlanItem) {
    setSwapItem(item);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const kcal = item.recipe?.kcal ?? 400;
    const list = await getSuggestionsForSwap(
      supabase,
      anamnesis,
      item.meal_type,
      kcal,
      item.recipe_id
    );
    setSwapSuggestions(list);
  }

  async function confirmSwap(newRecipeId: string) {
    if (!swapItem) return;
    setSwapLoading(true);
    const { ok, error } = await swapMealItem(supabase, swapItem.id, newRecipeId);
    setSwapLoading(false);
    if (ok) {
      setSwapItem(null);
      toast.success("Refeição trocada.");
      fetchToday();
    } else {
      toast.error(error ?? "Erro ao trocar.");
    }
  }

  async function toggleConsumed(item: UserMealPlanItem) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isConsumed = consumed.consumedItemIds.includes(item.id);
    if (isConsumed) {
      const { ok, error } = await unconsumeMeal(supabase, user.id, todayStr, item.id);
      if (ok) {
        setConsumed((c) => ({
          totalKcal: c.totalKcal - (item.recipe?.kcal ?? 0),
          consumedItemIds: c.consumedItemIds.filter((id) => id !== item.id),
        }));
        toast.success("Desmarcado.");
      } else toast.error(error);
    } else {
      const { ok, error } = await consumeMeal(
        supabase,
        user.id,
        todayStr,
        item.id,
        item.meal_type,
        item.recipe_id
      );
      if (ok) {
        setConsumed((c) => ({
          totalKcal: c.totalKcal + (item.recipe?.kcal ?? 0),
          consumedItemIds: [...c.consumedItemIds, item.id],
        }));
        toast.success("Marcado como consumido.");
      } else toast.error(error);
    }
    fetchToday();
  }

  async function handleSaveNote() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setNoteSaving(true);
    const { ok, error } = await saveNotes(supabase, user.id, todayStr, todayNote);
    setNoteSaving(false);
    if (ok) toast.success("Nota salva.");
    else toast.error(error ?? "Erro ao salvar.");
  }

  if (loading && !plan && !mealPlanData) {
    return (
      <div className="space-y-4">
        <div className="border border-border rounded-xl shadow-sm p-4 animate-pulse">
          <div className="h-4 bg-zinc-200 rounded w-1/3" />
          <div className="h-5 bg-zinc-200 rounded w-2/3 mt-2" />
        </div>
        <div className="border border-border rounded-xl shadow-sm p-4 animate-pulse">
          <div className="h-4 bg-zinc-200 rounded w-1/4" />
          <div className="h-3 bg-zinc-200 rounded w-full mt-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Treino (daily_plans) */}
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
            <div className="text-sm text-zinc-600">Ainda não geramos seu plano de treino.</div>
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

      {/* Refeições (user_meal_plans) */}
      <section className="border border-border rounded-xl shadow-sm p-4">
        <div className="text-sm text-zinc-500">🍽️ Refeições do plano</div>
        {mealPlanData ? (
          <>
            <div className="mt-2 flex items-center justify-between gap-2 text-sm text-zinc-600">
              <span>Meta: {mealPlanData.plan.calories_target} kcal</span>
              <span>Consumido: {consumed.totalKcal} kcal</span>
            </div>
            <div className="mt-2 space-y-2">
              {mealPlanData.items.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 bg-surface"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center text-zinc-400 text-xl">
                    {m.recipe?.image_url ? (
                      <img src={m.recipe.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>🍽️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{m.meal_type}</div>
                    <div className="text-sm text-zinc-600">{m.recipe?.title ?? "—"}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {m.recipe?.kcal != null ? `${m.recipe.kcal} kcal` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => openSwap(m)}
                      className="rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-ink hover:bg-muted"
                    >
                      Trocar
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleConsumed(m)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                        consumed.consumedItemIds.includes(m.id)
                          ? "bg-green-100 border-green-300 text-green-800"
                          : "border-border text-ink hover:bg-muted"
                      }`}
                    >
                      {consumed.consumedItemIds.includes(m.id) ? "✓ Consumido" : "Marcar consumido"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="text-sm text-zinc-600">
              Gere seu plano alimentar (7 dias) para ver as refeições de hoje.
            </div>
            <button
              onClick={handleGenerateMealPlan}
              disabled={seedLoading}
              className="w-full bg-primary-500 text-white py-3 rounded-xl shadow-sm transition duration-250 disabled:opacity-50 font-medium"
            >
              {seedLoading ? "Gerando plano..." : "Gerar plano agora"}
            </button>
          </div>
        )}
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

      {/* Notas do dia */}
      <section className="border border-border rounded-xl shadow-sm p-4">
        <div className="text-sm text-zinc-500">📝 Notas do dia</div>
        <textarea
          value={todayNote}
          onChange={(e) => setTodayNote(e.target.value)}
          onBlur={handleSaveNote}
          placeholder="Anote como se sentiu, dúvidas, etc."
          rows={3}
          className="mt-2 w-full rounded-xl border border-border bg-surface text-ink placeholder-zinc-400 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={noteSaving}
            className="rounded-xl bg-primary-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {noteSaving ? "Salvando..." : "Salvar nota"}
          </button>
        </div>
      </section>

      {/* Modal Trocar */}
      {swapItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !swapLoading && setSwapItem(null)}
        >
          <div
            className="bg-surface border border-border rounded-xl shadow-lg max-w-md w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-semibold text-ink">Trocar: {swapItem.meal_type}</div>
            <div className="text-sm text-zinc-600 mt-1">Escolha uma sugestão (kcal similar)</div>
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {swapSuggestions.length === 0 && !swapLoading && (
                <div className="text-sm text-zinc-500">Nenhuma sugestão no momento.</div>
              )}
              {swapSuggestions.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => confirmSwap(r.id)}
                  disabled={swapLoading}
                  className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted transition flex justify-between items-center"
                >
                  <span className="font-medium text-ink">{r.title}</span>
                  <span className="text-sm text-zinc-500">{r.kcal != null ? `${r.kcal} kcal` : ""}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSwapItem(null)}
                className="rounded-xl border border-border px-4 py-2 text-sm text-ink hover:bg-muted"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
