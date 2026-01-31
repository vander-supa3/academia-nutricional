import { supabase } from "./supabase";

/**
 * Gera plano alimentar de 7 dias a partir da anamnese do usuário.
 * Usa meal_plan_templates + template_meals (devem estar populados via seed).
 * Se não houver anamnese ou templates, não faz nada (caller pode fallback para ensureUserSeed).
 */
export async function ensureMealPlan(userId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: anamnesis, error: anamErr } = await supabase
    .from("user_anamnesis")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (anamErr || !anamnesis) {
    return { ok: false, error: "Anamnese não encontrada. Conclua o onboarding." };
  }

  const goal = anamnesis.goal as string;
  const caloriesMin = anamnesis.calories_min as number;
  const caloriesMax = anamnesis.calories_max as number;
  const mealsPerDay = anamnesis.meals_per_day as number;

  const { data: templates } = await supabase
    .from("meal_plan_templates")
    .select("id")
    .eq("goal", goal)
    .lte("calories_min", caloriesMax)
    .gte("calories_max", caloriesMin)
    .eq("meals_per_day", mealsPerDay)
    .limit(1);

  const templateId = templates?.[0]?.id;
  if (!templateId) {
    return { ok: false, error: "Nenhum template encontrado para seu perfil. Contate o suporte." };
  }

  const { data: templateMeals, error: tmErr } = await supabase
    .from("template_meals")
    .select("day_index, meal_type, recipe_id, portion_multiplier, order_index")
    .eq("template_id", templateId)
    .order("day_index")
    .order("order_index");

  if (tmErr || !templateMeals?.length) {
    return { ok: false, error: "Template sem refeições. Rode o seed de templates." };
  }

  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const caloriesTarget = Math.round((caloriesMin + caloriesMax) / 2);

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const date = dates[dayIdx];

    const { data: existing } = await supabase
      .from("user_meal_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (existing) continue;

    const { data: plan, error: planErr } = await supabase
      .from("user_meal_plans")
      .insert({
        user_id: userId,
        date,
        template_id: templateId,
        calories_target: caloriesTarget,
        goal,
      })
      .select("id")
      .single();

    if (planErr || !plan?.id) {
      return { ok: false, error: planErr?.message ?? "Erro ao criar plano do dia." };
    }

    const mealsForDay = templateMeals.filter((tm) => tm.day_index === dayIdx);
    const items = mealsForDay.map((tm, i) => ({
      user_meal_plan_id: plan.id,
      meal_type: tm.meal_type,
      recipe_id: tm.recipe_id,
      order_index: i + 1,
      is_swapped: false,
      swapped_from_recipe_id: null,
    }));

    if (items.length > 0) {
      const { error: itemsErr } = await supabase.from("user_meal_plan_items").insert(items);
      if (itemsErr) {
        return { ok: false, error: itemsErr.message };
      }
    }
  }

  return { ok: true };
}
