/**
 * Seed global: 30 treinos + exercícios + 20 receitas.
 * Rodar: npm run seed:global
 * Requer em .env.local: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Settings → API → service_role)
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

type WorkoutSeed = {
  title: string;
  focus: string;
  minutes: number;
  level: string;
  equipment: string;
  description: string;
};

type ExerciseSeed = { name: string; seconds: number; order_index: number };

function buildWorkoutLibrary(): Array<{ workout: WorkoutSeed; exercises: ExerciseSeed[] }> {
  const base = [
    { focus: "Pernas + Abdômen", level: "Iniciante", equipment: "Sem equipamento" },
    { focus: "Fullbody", level: "Iniciante", equipment: "Sem equipamento" },
    { focus: "Cardio + Core", level: "Intermediário", equipment: "Sem equipamento" },
    { focus: "Mobilidade", level: "Iniciante", equipment: "Sem equipamento" },
    { focus: "Glúteos + Pernas", level: "Intermediário", equipment: "Sem equipamento" },
    { focus: "Braços + Core", level: "Iniciante", equipment: "Sem equipamento" },
  ];

  const templates = [
    (focus: string) => ({
      title: `HIIT 20 min — ${focus}`,
      minutes: 20,
      description: "Sequência rápida, sem equipamento. Ritmo constante e técnica limpa.",
    }),
    (focus: string) => ({
      title: `Treino 15 min — ${focus}`,
      minutes: 15,
      description: "Rápido e eficiente. Ideal para dias corridos.",
    }),
    (focus: string) => ({
      title: `Treino 25 min — ${focus}`,
      minutes: 25,
      description: "Volume moderado com foco em consistência e controle.",
    }),
    (focus: string) => ({
      title: `Circuito 20 min — ${focus}`,
      minutes: 20,
      description: "Circuito com pausas curtas. Excelente para manter o hábito.",
    }),
    (focus: string) => ({
      title: `Mobilidade 12 min — ${focus}`,
      minutes: 12,
      description: "Soltar o corpo, melhorar amplitude e reduzir rigidez.",
    }),
  ];

  const exercisePools: Record<string, string[]> = {
    "Pernas + Abdômen": ["Agachamento", "Afundo", "Ponte de glúteos", "Prancha", "Abdominal bicicleta", "Elevação de pernas"],
    "Fullbody": ["Polichinelo", "Agachamento", "Flexão inclinada", "Corrida parada", "Prancha", "Burpee leve"],
    "Cardio + Core": ["Mountain climber", "Corrida parada", "Prancha", "Abdominal canivete", "Polichinelo", "Prancha lateral"],
    "Mobilidade": ["Alongamento posterior", "Mobilidade de quadril", "Gato-vaca", "Rotação torácica", "Alongamento de panturrilha", "Respiração diafragmática"],
    "Glúteos + Pernas": ["Agachamento sumô", "Afundo reverso", "Ponte unilateral", "Elevação lateral de perna", "Agachamento pulsante", "Prancha"],
    "Braços + Core": ["Flexão (joelhos)", "Tríceps no banco", "Prancha", "Prancha com toque no ombro", "Abdominal curto", "Superman"],
  };

  const library: Array<{ workout: WorkoutSeed; exercises: ExerciseSeed[] }> = [];
  let count = 0;

  while (library.length < 30) {
    const b = base[count % base.length];
    const t = templates[count % templates.length](b.focus);
    const ex = exercisePools[b.focus];
    const picks = [ex[0], ex[1], ex[2], ex[3]];
    const exercises: ExerciseSeed[] = picks.map((name, idx) => ({
      name,
      seconds: idx === 3 ? 60 : 45,
      order_index: idx + 1,
    }));

    library.push({
      workout: {
        title: t.title,
        focus: b.focus,
        minutes: t.minutes,
        level: b.level,
        equipment: b.equipment,
        description: t.description,
      },
      exercises,
    });
    count++;
  }

  return library;
}

function buildRecipes() {
  const recipes = [
    { title: "Omelete + banana", meal_type: "Café da manhã", kcal: 350, ingredients: "2 ovos, 1 banana, sal", instructions: "Bata ovos, faça omelete. Banana à parte.", cheap: true },
    { title: "Iogurte + aveia + fruta", meal_type: "Café da manhã", kcal: 380, ingredients: "Iogurte, aveia, fruta", instructions: "Misture e sirva.", cheap: true },
    { title: "Cuscuz com ovo", meal_type: "Café da manhã", kcal: 420, ingredients: "Cuscuz, 1 ovo", instructions: "Prepare cuscuz, adicione ovo.", cheap: true },
    { title: "Tapioca + queijo + fruta", meal_type: "Café da manhã", kcal: 410, ingredients: "Goma de tapioca, queijo, fruta", instructions: "Aqueça, recheie, sirva.", cheap: true },
    { title: "Arroz + feijão + frango + salada", meal_type: "Almoço", kcal: 550, ingredients: "Arroz, feijão, frango, salada", instructions: "Monte o prato com porções equilibradas.", cheap: true },
    { title: "Macarrão simples + frango + legumes", meal_type: "Almoço", kcal: 600, ingredients: "Macarrão, frango, legumes", instructions: "Cozinhe, grelhe, junte.", cheap: true },
    { title: "Sardinha + arroz + salada", meal_type: "Almoço", kcal: 580, ingredients: "Sardinha, arroz, salada", instructions: "Monte o prato.", cheap: true },
    { title: "Carne moída + arroz + salada", meal_type: "Almoço", kcal: 650, ingredients: "Carne moída, arroz, salada", instructions: "Refogue e monte.", cheap: true },
    { title: "Peixe + arroz + feijão", meal_type: "Almoço", kcal: 590, ingredients: "Peixe, arroz, feijão", instructions: "Grelhe peixe, sirva com arroz e feijão.", cheap: true },
    { title: "Peixe + batata doce + legumes", meal_type: "Jantar", kcal: 450, ingredients: "Peixe, batata doce, legumes", instructions: "Asse/cozinhe e monte.", cheap: true },
    { title: "Sopa de legumes + frango desfiado", meal_type: "Jantar", kcal: 430, ingredients: "Legumes, frango", instructions: "Cozinhe legumes, adicione frango.", cheap: true },
    { title: "Omelete de legumes + salada", meal_type: "Jantar", kcal: 430, ingredients: "Ovos, legumes, salada", instructions: "Faça omelete e sirva.", cheap: true },
    { title: "Atum + legumes + batata", meal_type: "Jantar", kcal: 470, ingredients: "Atum, legumes, batata", instructions: "Cozinhe e sirva.", cheap: true },
    { title: "Banana + pasta de amendoim", meal_type: "Lanche", kcal: 250, ingredients: "Banana, pasta de amendoim", instructions: "Passe e coma.", cheap: true },
    { title: "Maçã + castanhas", meal_type: "Lanche", kcal: 220, ingredients: "Maçã, castanhas", instructions: "Pronto.", cheap: true },
    { title: "Pão integral + ovo", meal_type: "Lanche", kcal: 280, ingredients: "Pão integral, ovo", instructions: "Monte.", cheap: true },
    { title: "Iogurte natural", meal_type: "Lanche", kcal: 160, ingredients: "Iogurte", instructions: "Pronto.", cheap: true },
    { title: "Vitamina de banana + aveia", meal_type: "Lanche", kcal: 300, ingredients: "Leite/água, banana, aveia", instructions: "Bata tudo.", cheap: true },
    { title: "Frango + purê de batata doce + legumes", meal_type: "Jantar", kcal: 520, ingredients: "Frango, batata doce, legumes", instructions: "Cozinhe e monte.", cheap: true },
    { title: "Arroz + feijão + ovos + salada", meal_type: "Almoço", kcal: 540, ingredients: "Arroz, feijão, ovos, salada", instructions: "Monte o prato.", cheap: true },
  ];
  return recipes;
}

async function main() {
  const { count: workoutCount } = await supabase.from("workouts").select("*", { count: "exact", head: true });
  const { count: recipeCount } = await supabase.from("recipes").select("*", { count: "exact", head: true });

  if ((workoutCount ?? 0) >= 30) {
    console.log("workouts já possui 30+ registros. Pulando seed de treinos.");
  } else {
    console.log("Seeding workouts...");
    const library = buildWorkoutLibrary();

    for (const item of library) {
    const { data: w, error } = await supabase
      .from("workouts")
      .insert(item.workout)
      .select()
      .single();
    if (error) throw error;
    await supabase.from("workout_exercises").insert(
      item.exercises.map((e) => ({ ...e, workout_id: w.id }))
    );
    }
  }

  if ((recipeCount ?? 0) >= 20) {
    console.log("recipes já possui 20+ registros. Pulando seed de receitas.");
  } else {
    console.log("Seeding recipes...");
    const recipes = buildRecipes();
    const { error: rerr } = await supabase.from("recipes").insert(recipes);
    if (rerr) throw rerr;
  }

  console.log("✅ Seed global concluído.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
