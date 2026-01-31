/**
 * Seed de meal_plan_templates e template_meals.
 * Rodar após schema + recipes: npm run seed:templates
 * Requer: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY em .env.local
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const MEAL_TYPES = ["Café da manhã", "Almoço", "Jantar", "Lanche"];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

async function main() {
  const { count: templateCount } = await supabase
    .from("meal_plan_templates")
    .select("*", { count: "exact", head: true });

  if ((templateCount ?? 0) > 0) {
    console.log("Templates já existem. Pulando seed.");
    return;
  }

  const { data: recipes, error: rErr } = await supabase.from("recipes").select("id, meal_type");
  if (rErr || !recipes?.length) {
    console.error("Erro ao carregar receitas. Rode npm run seed:global antes.");
    process.exit(1);
  }

  const byMealType: Record<string, Array<{ id: string }>> = {};
  for (const mt of MEAL_TYPES) {
    byMealType[mt] = recipes.filter((r) => r.meal_type === mt).map((r) => ({ id: r.id }));
  }

  const templatesToCreate = [
    { goal: "emagrecer", calories_min: 1500, calories_max: 2000, meals_per_day: 4, name: "Emagrecer 1500-2000" },
    { goal: "hipertrofia", calories_min: 2500, calories_max: 4000, meals_per_day: 4, name: "Hipertrofia 2500-4000" },
    { goal: "manter", calories_min: 1800, calories_max: 2500, meals_per_day: 4, name: "Manter 1800-2500" },
  ];

  for (const t of templatesToCreate) {
    const { data: template, error: tErr } = await supabase
      .from("meal_plan_templates")
      .insert(t)
      .select("id")
      .single();

    if (tErr || !template) {
      console.error("Erro ao criar template:", tErr);
      process.exit(1);
    }

    const templateMealsRows: Array<{
      template_id: string;
      day_index: number;
      meal_type: string;
      recipe_id: string;
      portion_multiplier: number;
      order_index: number;
    }> = [];
    for (let day = 0; day < 7; day++) {
      for (let m = 0; m < MEAL_TYPES.length; m++) {
        const mealType = MEAL_TYPES[m];
        const options = byMealType[mealType];
        if (!options?.length) continue;
        const recipe = pick(options, day + m);
        templateMealsRows.push({
          template_id: template.id,
          day_index: day,
          meal_type: mealType,
          recipe_id: recipe.id,
          portion_multiplier: 1,
          order_index: day * MEAL_TYPES.length + m + 1,
        });
      }
    }
    if (templateMealsRows.length > 0) {
      const { error: tmErr } = await supabase.from("template_meals").insert(templateMealsRows);
      if (tmErr) {
        console.error("Erro ao criar template_meals:", tmErr);
        process.exit(1);
      }
    }
  }

  console.log("✅ Seed de meal templates concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
