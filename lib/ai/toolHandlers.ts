import type { SupabaseClient } from "@supabase/supabase-js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function getUserId(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

type DailyLogPatch = Partial<{
  water_ml: number;
  workout_done: boolean;
  meals_logged: boolean;
  fasting_today: boolean;
  fasting_window: string | null;
  weight_kg: number | null;
}>;

async function upsertDailyLogMerge(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  patch: DailyLogPatch
) {
  const { data: current, error: e1 } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (e1) return { ok: false, error: e1.message };

  const merged = {
    user_id: userId,
    date,
    water_ml: current?.water_ml ?? 0,
    workout_done: current?.workout_done ?? false,
    meals_logged: current?.meals_logged ?? false,
    fasting_today: current?.fasting_today ?? false,
    fasting_window: current?.fasting_window ?? null,
    weight_kg: current?.weight_kg ?? null,
    ...patch,
  };

  const { error: e2 } = await supabase
    .from("daily_logs")
    .upsert(merged, { onConflict: "user_id,date" });
  if (e2) return { ok: false, error: e2.message };

  return { ok: true, daily_log: merged };
}

export async function handleToolCall(
  supabase: SupabaseClient,
  name: string,
  args: Record<string, unknown>
) {
  switch (name) {
    // ==========================
    // NOVAS TOOLS (merge-safe em daily_logs)
    // ==========================

    case "get_today": {
      const userId = await getUserId(supabase);
      if (!userId) return { ok: false, error: "unauthorized" };

      const date = (args?.date as string) || todayISO();
      const d = new Date(date + "T00:00:00");
      const jsDay = d.getDay();
      const dayIndex = jsDay === 0 ? 7 : jsDay;

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("id,name,goal,fasting_enabled,fasting_style,fasting_days_per_week,fasting_notes")
        .eq("id", userId)
        .maybeSingle();

      if (pErr) return { ok: false, error: pErr.message };

      const { data: plan, error: plErr } = await supabase
        .from("daily_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("day_index", dayIndex)
        .maybeSingle();

      if (plErr) return { ok: false, error: plErr.message };

      let meals: Array<Record<string, unknown>> = [];
      if (plan?.id) {
        const { data: pm, error: mErr } = await supabase
          .from("plan_meals")
          .select("*")
          .eq("plan_id", plan.id)
          .order("order_index", { ascending: true });

        if (mErr) return { ok: false, error: mErr.message };
        meals = (pm ?? []) as Array<Record<string, unknown>>;
      }

      const { data: log, error: lErr } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      if (lErr) return { ok: false, error: lErr.message };

      const kcalMin = (plan as { kcal_min?: number } | null)?.kcal_min ?? 1800;
      const kcalMax = (plan as { kcal_max?: number } | null)?.kcal_max ?? 2200;

      return {
        ok: true,
        date,
        dayIndex,
        kcal: { min: kcalMin, max: kcalMax },
        profile: profile ?? null,
        plan: plan ?? null,
        meals,
        log: log ?? null,
      };
    }

    case "generate_week_plan": {
      const userId = await getUserId(supabase);
      if (!userId) return { ok: false, error: "unauthorized" };

      const force = !!args?.force;

      if (!force) {
        const { count } = await supabase
          .from("daily_plans")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if ((count ?? 0) >= 7) {
          return {
            ok: true,
            message:
              "Semana já existe. Use force=true para recriar.",
          };
        }
      } else {
        await supabase.from("daily_plans").delete().eq("user_id", userId);
      }

      const { data: recipes, error: rErr } = await supabase
        .from("recipes")
        .select("id,title,meal_type,kcal,cheap")
        .eq("cheap", true);

      if (rErr) return { ok: false, error: rErr.message };
      const list = (recipes ?? []) as Array<{
        id: string;
        title: string;
        meal_type: string;
        kcal: number | null;
        cheap: boolean | null;
      }>;

      const byType = (type: string) =>
        list.filter((x) => x.meal_type === type);
      const breakfasts = byType("Café da manhã");
      const lunches = byType("Almoço");
      const dinners = byType("Jantar");
      const snacks = byType("Lanche");

      const { data: workouts, error: wErr } = await supabase
        .from("workouts")
        .select("id,title,minutes,focus")
        .order("created_at", { ascending: false });

      if (wErr) return { ok: false, error: wErr.message };
      const wList = (workouts ?? []) as Array<{
        id: string;
        title: string;
        minutes: number;
        focus: string;
      }>;

      const defaultKcalMin = 1800;
      const defaultKcalMax = 2200;

      const pick = <T,>(arr: T[], i: number): T | null =>
        arr.length ? arr[i % arr.length] ?? null : null;

      for (let day = 1; day <= 7; day++) {
        const workout = pick(wList, day - 1);

        const { data: plan, error: pErr } = await supabase
          .from("daily_plans")
          .insert({
            user_id: userId,
            day_index: day,
            title: "Plano de hoje",
            workout_title: workout?.title ?? "Treino 20 min (sem equipamento)",
            workout_minutes: workout?.minutes ?? 20,
            water_goal_ml: 2500,
            kcal_min: defaultKcalMin,
            kcal_max: defaultKcalMax,
          })
          .select()
          .single();

        if (pErr) return { ok: false, error: pErr.message };

        const planId = (plan as { id: string }).id;
        const b = pick(breakfasts, day - 1);
        const a = pick(lunches, day - 1);
        const j = pick(dinners, day - 1);
        const sn = pick(snacks, day - 1);

        const mealRows = [
          b && {
            plan_id: planId,
            meal_type: "Café da manhã",
            recipe_title: b.title,
            kcal: b.kcal ?? null,
            order_index: 1,
          },
          a && {
            plan_id: planId,
            meal_type: "Almoço",
            recipe_title: a.title,
            kcal: a.kcal ?? null,
            order_index: 2,
          },
          j && {
            plan_id: planId,
            meal_type: "Jantar",
            recipe_title: j.title,
            kcal: j.kcal ?? null,
            order_index: 3,
          },
          sn && {
            plan_id: planId,
            meal_type: "Lanche",
            recipe_title: sn.title,
            kcal: sn.kcal ?? null,
            order_index: 4,
          },
        ].filter(Boolean) as Array<{
          plan_id: string;
          meal_type: string;
          recipe_title: string;
          kcal: number | null;
          order_index: number;
        }>;

        if (mealRows.length > 0) {
          const { error: pmErr } = await supabase
            .from("plan_meals")
            .insert(mealRows);
          if (pmErr) return { ok: false, error: pmErr.message };
        }
      }

      return { ok: true, message: "Semana gerada com sucesso (7 dias)." };
    }

    case "log_water": {
      const userId = await getUserId(supabase);
      if (!userId) return { ok: false, error: "unauthorized" };

      const date = (args?.date as string) || todayISO();
      const waterMl = Number(args?.waterMl);

      if (!Number.isFinite(waterMl) || waterMl < 0) {
        return { ok: false, error: "waterMl inválido" };
      }

      return await upsertDailyLogMerge(supabase, userId, date, {
        water_ml: waterMl,
      });
    }

    case "complete_workout": {
      const userId = await getUserId(supabase);
      if (!userId) return { ok: false, error: "unauthorized" };

      const date = (args?.date as string) || todayISO();
      return await upsertDailyLogMerge(supabase, userId, date, {
        workout_done: true,
      });
    }

    // ==========================
    // Já existentes
    // ==========================

    case "search_recipes": {
      const q = (args.query ?? "").toString();
      const mealType = (args.mealType ?? "").toString();

      let query = supabase.from("recipes").select("*").order("title");
      if (mealType) query = query.eq("meal_type", mealType);
      if (q) query = query.ilike("title", `%${q}%`);

      const { data, error } = await query;
      if (error) return { ok: false, error: error.message };
      return { ok: true, recipes: data ?? [] };
    }

    case "search_workouts": {
      const q = (args.query ?? "").toString();
      const focus = (args.focus ?? "").toString();
      const minutesMax = Number(args.minutesMax ?? 0);

      let query = supabase
        .from("workouts")
        .select("*")
        .order("created_at", { ascending: false });
      if (focus) query = query.eq("focus", focus);
      if (minutesMax) query = query.lte("minutes", minutesMax);
      if (q) query = query.ilike("title", `%${q}%`);

      const { data, error } = await query;
      if (error) return { ok: false, error: error.message };
      return { ok: true, workouts: data ?? [] };
    }

    case "get_workout": {
      const id = args.workoutId as string;
      const { data: w, error: e1 } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", id)
        .single();
      if (e1) return { ok: false, error: e1.message };

      const { data: ex, error: e2 } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", id)
        .order("order_index", { ascending: true });

      if (e2) return { ok: false, error: e2.message };
      return { ok: true, workout: w, exercises: ex ?? [] };
    }

    case "get_progress_summary": {
      const userId = await getUserId(supabase);
      if (!userId) return { ok: false, error: "unauthorized" };

      const since = new Date();
      since.setDate(since.getDate() - 14);
      const sinceStr = since.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("date", sinceStr)
        .order("date", { ascending: false });

      if (error) return { ok: false, error: error.message };

      const logs = (data ?? []) as Array<{
        workout_done?: boolean;
        water_ml?: number;
      }>;
      const workoutsDone = logs.filter((l) => l.workout_done).length;
      const avgWater =
        logs.length > 0
          ? Math.round(
              logs.reduce((s, l) => s + (l.water_ml || 0), 0) / logs.length
            )
          : 0;

      return { ok: true, workoutsDone, avgWater, last14Days: logs };
    }

    default:
      return { ok: false, error: `Tool não implementada: ${name}` };
  }
}
