import type { SupabaseClient } from "@supabase/supabase-js";

export async function handleToolCall(
  supabase: SupabaseClient,
  name: string,
  args: Record<string, unknown>
) {
  switch (name) {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { ok: false, error: "unauthorized" };

      const since = new Date();
      since.setDate(since.getDate() - 14);
      const sinceStr = since.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", sinceStr)
        .order("date", { ascending: false });

      if (error) return { ok: false, error: error.message };

      const logs = (data ?? []) as Array<{ workout_done?: boolean; water_ml?: number }>;
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
