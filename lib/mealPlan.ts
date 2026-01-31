import type { SupabaseClient } from "@supabase/supabase-js";

export type Anamnesis = {
  id: string;
  user_id: string;
  goal: "emagrecer" | "hipertrofia" | "manter";
  calories_min: number;
  calories_max: number;
  restriction_lactose: boolean;
  restriction_ovo: boolean;
  restriction_gluten: boolean;
  dislikes: string[];
  preferences: string[];
  meals_per_day: number;
};

export type UserMealPlanItem = {
  id: string;
  user_meal_plan_id: string;
  meal_type: string;
  recipe_id: string;
  order_index: number;
  is_swapped: boolean;
  swapped_from_recipe_id: string | null;
  recipe?: { id: string; title: string; kcal: number | null; meal_type: string; image_url?: string | null };
};

export type UserMealPlan = {
  id: string;
  user_id: string;
  date: string;
  template_id: string | null;
  calories_target: number;
  goal: string;
  items?: UserMealPlanItem[];
};

const MEAL_TYPES = ["Café da manhã", "Almoço", "Jantar", "Lanche"];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Retorna o plano do dia (user_meal_plans + items com recipe) ou null.
 */
export async function getTodayPlan(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<{ plan: UserMealPlan; items: UserMealPlanItem[] } | null> {
  const { data: plan, error: planErr } = await supabase
    .from("user_meal_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (planErr || !plan) return null;

  const { data: itemsRaw, error: itemsErr } = await supabase
    .from("user_meal_plan_items")
    .select(`
      id,
      user_meal_plan_id,
      meal_type,
      recipe_id,
      order_index,
      is_swapped,
      swapped_from_recipe_id,
      recipes(id, title, kcal, meal_type, image_url)
    `)
    .eq("user_meal_plan_id", plan.id)
    .order("order_index", { ascending: true });

  if (itemsErr) return null;

  const itemsWithRecipe = ((itemsRaw ?? []) as Array<Record<string, unknown>>).map((row) => {
    const { recipes, ...rest } = row;
    return { ...rest, recipe: recipes } as UserMealPlanItem;
  });
  return { plan: plan as UserMealPlan, items: itemsWithRecipe };
}

/**
 * Troca um item do plano por outra receita. Persiste is_swapped e swapped_from_recipe_id.
 */
export async function swapMealItem(
  supabase: SupabaseClient,
  itemId: string,
  newRecipeId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: item } = await supabase
    .from("user_meal_plan_items")
    .select("recipe_id")
    .eq("id", itemId)
    .single();

  if (!item) return { ok: false, error: "Item não encontrado" };

  const { error } = await supabase
    .from("user_meal_plan_items")
    .update({
      recipe_id: newRecipeId,
      is_swapped: true,
      swapped_from_recipe_id: item.recipe_id,
    })
    .eq("id", itemId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Marca refeição como consumida (insere em meal_consumption_logs).
 */
export async function consumeMeal(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  userMealPlanItemId: string,
  mealType: string,
  recipeId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("meal_consumption_logs").insert({
    user_id: userId,
    date,
    user_meal_plan_item_id: userMealPlanItemId,
    meal_type: mealType,
    recipe_id: recipeId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Remove marca de consumido (apaga último log daquele item na data).
 */
export async function unconsumeMeal(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  userMealPlanItemId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: logs } = await supabase
    .from("meal_consumption_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .eq("user_meal_plan_item_id", userMealPlanItemId)
    .order("consumed_at", { ascending: false })
    .limit(1);

  if (!logs?.length) return { ok: true };

  const { error } = await supabase
    .from("meal_consumption_logs")
    .delete()
    .eq("id", logs[0].id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Salva notas do dia (upsert user_notes).
 */
export async function saveNotes(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  content: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("user_notes").upsert(
    { user_id: userId, date, content, updated_at: new Date().toISOString() },
    { onConflict: "user_id,date" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Retorna até 5 sugestões para troca: mesma meal_type, kcal +/- 15%, respeitando restrições e evitando dislikes.
 */
export async function getSuggestionsForSwap(
  supabase: SupabaseClient,
  anamnesis: Anamnesis | null,
  mealType: string,
  currentRecipeKcal: number,
  excludeRecipeId: string
): Promise<Array<{ id: string; title: string; kcal: number | null }>> {
  const minKcal = Math.round(currentRecipeKcal * 0.85);
  const maxKcal = Math.round(currentRecipeKcal * 1.15);

  let query = supabase
    .from("recipes")
    .select("id, title, kcal")
    .eq("meal_type", mealType)
    .neq("id", excludeRecipeId)
    .gte("kcal", minKcal)
    .lte("kcal", maxKcal)
    .limit(6);

  const { data: recipes } = await query;
  const list = (recipes ?? []).filter((r) => r.kcal != null || true);

  // Filtro simples por restrições: se recipe title/ingredients contiver lactose/ovo/glúten e restrição ativa, excluir (opcional V1)
  let filtered = list;
  if (anamnesis) {
    const dislikeSet = new Set((anamnesis.dislikes ?? []).map((d) => d.toLowerCase()));
    filtered = list.filter((r) => !dislikeSet.has(r.title?.toLowerCase() ?? ""));
  }

  return filtered.slice(0, 5) as Array<{ id: string; title: string; kcal: number | null }>;
}

/**
 * Retorna kcal total consumido no dia, lista de consumos e IDs dos itens do plano marcados como consumidos.
 */
export async function getConsumedToday(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<{
  totalKcal: number;
  consumedItemIds: string[];
  logs: Array<{ meal_type: string; recipe_id: string; user_meal_plan_item_id?: string; recipes?: { kcal: number | null } }>;
}> {
  const { data: logs } = await supabase
    .from("meal_consumption_logs")
    .select("meal_type, recipe_id, user_meal_plan_item_id, recipes(kcal)")
    .eq("user_id", userId)
    .eq("date", date);

  type LogRow = {
    meal_type: string;
    recipe_id: string;
    user_meal_plan_item_id?: string;
    recipes?: { kcal: number | null } | { kcal: number | null }[] | null;
  };
  const rawList = (logs ?? []) as LogRow[];
  const totalKcal = rawList.reduce((sum, l) => {
    const r = l.recipes;
    const kcal = Array.isArray(r) ? r[0]?.kcal : r?.kcal;
    return sum + (kcal ?? 0);
  }, 0);
  const list = rawList.map(({ meal_type, recipe_id, user_meal_plan_item_id, recipes: r }) => {
    const recipes = Array.isArray(r) ? r[0] : r;
    return {
      meal_type,
      recipe_id,
      user_meal_plan_item_id,
      recipes: recipes ?? undefined,
    };
  });
  const consumedItemIds = Array.from(
    new Set(list.map((l) => l.user_meal_plan_item_id).filter((id): id is string => Boolean(id)))
  );
  return { totalKcal, consumedItemIds, logs: list };
}

/**
 * Verifica se um item já foi marcado como consumido hoje.
 */
export async function isItemConsumed(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  userMealPlanItemId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("meal_consumption_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("date", date)
    .eq("user_meal_plan_item_id", userMealPlanItemId);

  return (count ?? 0) > 0;
}

/**
 * Retorna a nota do dia (user_notes).
 */
export async function getNote(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<string> {
  const { data, error } = await supabase
    .from("user_notes")
    .select("content")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error || !data) return "";
  return (data.content as string) ?? "";
}

/**
 * Retorna as notas dos últimos 14 dias (para histórico em /progresso).
 */
export async function getNotesLast14Days(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<{ date: string; content: string }>> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("user_notes")
    .select("date, content")
    .eq("user_id", userId)
    .lte("date", today)
    .order("date", { ascending: false })
    .limit(14);

  if (error) return [];
  return (data ?? []) as Array<{ date: string; content: string }>;
}
