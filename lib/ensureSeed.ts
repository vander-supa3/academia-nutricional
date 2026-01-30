import { supabase } from "./supabase";

const mockWeek = [
  {
    day_index: 1,
    title: "Plano de hoje",
    workout_title: "Treino 20 min pernas + abdômen na praia",
    workout_minutes: 20,
    water_goal_ml: 2500,
    kcal_min: 1800,
    kcal_max: 2200,
    meals: [
      { meal_type: "Café da manhã", recipe_title: "Omelete + pão integral + café", kcal: 350 },
      { meal_type: "Almoço", recipe_title: "Arroz, feijão, frango grelhado + salada", kcal: 550 },
      { meal_type: "Jantar", recipe_title: "Peixe + batata doce + legumes", kcal: 450 },
    ],
  },
  {
    day_index: 2,
    title: "Plano de hoje",
    workout_title: "Treino 20 min fullbody em casa",
    workout_minutes: 20,
    water_goal_ml: 2500,
    kcal_min: 1800,
    kcal_max: 2200,
    meals: [
      { meal_type: "Café da manhã", recipe_title: "Iogurte + aveia + banana", kcal: 380 },
      { meal_type: "Almoço", recipe_title: "Macarrão simples + frango + legumes", kcal: 600 },
      { meal_type: "Jantar", recipe_title: "Ovos mexidos + salada + arroz", kcal: 480 },
    ],
  },
  {
    day_index: 3,
    title: "Plano de hoje",
    workout_title: "HIIT 20 min (sem equipamento)",
    workout_minutes: 20,
    water_goal_ml: 2500,
    kcal_min: 1800,
    kcal_max: 2200,
    meals: [
      { meal_type: "Café da manhã", recipe_title: "Cuscuz com ovo + café", kcal: 420 },
      { meal_type: "Almoço", recipe_title: "Arroz + feijão + sardinha + salada", kcal: 580 },
      { meal_type: "Jantar", recipe_title: "Sopa de legumes + frango desfiado", kcal: 430 },
    ],
  },
  {
    day_index: 4,
    title: "Plano de hoje",
    workout_title: "Treino 20 min core + mobilidade",
    workout_minutes: 20,
    water_goal_ml: 2500,
    kcal_min: 1800,
    kcal_max: 2200,
    meals: [
      { meal_type: "Café da manhã", recipe_title: "Tapioca + queijo + fruta", kcal: 410 },
      { meal_type: "Almoço", recipe_title: "Frango + arroz + feijão light", kcal: 560 },
      { meal_type: "Jantar", recipe_title: "Atum + legumes + batata", kcal: 470 },
    ],
  },
  {
    day_index: 5,
    title: "Plano de hoje",
    workout_title: "Pernas + glúteos 20 min",
    workout_minutes: 20,
    water_goal_ml: 2500,
    kcal_min: 1800,
    kcal_max: 2200,
    meals: [
      { meal_type: "Café da manhã", recipe_title: "Ovo + banana + aveia", kcal: 390 },
      { meal_type: "Almoço", recipe_title: "Carne moída + arroz + salada", kcal: 650 },
      { meal_type: "Jantar", recipe_title: "Frango + purê de batata doce + legumes", kcal: 520 },
    ],
  },
  {
    day_index: 6,
    title: "Plano de hoje",
    workout_title: "Cardio leve 20 min + alongamento",
    workout_minutes: 20,
    water_goal_ml: 2500,
    kcal_min: 1800,
    kcal_max: 2200,
    meals: [
      { meal_type: "Café da manhã", recipe_title: "Pão integral + ovo + café", kcal: 360 },
      { meal_type: "Almoço", recipe_title: "Arroz + feijão + peixe", kcal: 590 },
      { meal_type: "Jantar", recipe_title: "Omelete de legumes + salada", kcal: 430 },
    ],
  },
  {
    day_index: 7,
    title: "Plano de hoje",
    workout_title: "Descanso ativo: caminhada + mobilidade",
    workout_minutes: 20,
    water_goal_ml: 2500,
    kcal_min: 1800,
    kcal_max: 2200,
    meals: [
      { meal_type: "Café da manhã", recipe_title: "Vitamina de banana + aveia", kcal: 400 },
      { meal_type: "Almoço", recipe_title: "Frango + arroz + feijão + salada", kcal: 600 },
      { meal_type: "Jantar", recipe_title: "Sopa leve + torrada integral", kcal: 420 },
    ],
  },
];

export async function ensureUserSeed(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    name: (user.user_metadata?.name as string) ?? "Usuário",
  });

  const { count } = await supabase
    .from("daily_plans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) > 0) return;

  for (const day of mockWeek) {
    const { data: plan, error: planError } = await supabase
      .from("daily_plans")
      .insert({
        user_id: user.id,
        day_index: day.day_index,
        title: day.title,
        workout_title: day.workout_title,
        workout_minutes: day.workout_minutes,
        water_goal_ml: day.water_goal_ml,
        kcal_min: day.kcal_min,
        kcal_max: day.kcal_max,
      })
      .select()
      .single();

    if (planError) throw planError;
    if (!plan) continue;

    await supabase.from("plan_meals").insert(
      day.meals.map((m, idx) => ({
        plan_id: plan.id,
        meal_type: m.meal_type,
        recipe_title: m.recipe_title,
        kcal: m.kcal,
        order_index: idx + 1,
      }))
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      date: today,
      water_ml: 1200,
      workout_done: false,
      meals_logged: false,
    },
    { onConflict: "user_id,date" }
  );
}
