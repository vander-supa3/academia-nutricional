"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ensureMealPlan } from "@/lib/ensureMealPlan";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { toast } from "sonner";

const GOALS = [
  { value: "emagrecer", label: "Emagrecer", calories: [1500, 2000] },
  { value: "hipertrofia", label: "Ganho de massa", calories: [2500, 4000] },
  { value: "manter", label: "Manter peso", calories: [1800, 2500] },
] as const;

const DISLIKE_OPTIONS = ["Leite", "Ovo", "Pão", "Carne vermelha", "Queijo", "Glúten", "Lactose", "Fritura", "Doce"];
const PREFER_OPTIONS = ["Mais proteína", "Mais barato", "Low carb", "Vegetariano", "Rápido", "Receitas simples"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<"emagrecer" | "hipertrofia" | "manter">("manter");
  const [caloriesMin, setCaloriesMin] = useState(1800);
  const [caloriesMax, setCaloriesMax] = useState(2500);
  const [restrictionLactose, setRestrictionLactose] = useState(false);
  const [restrictionOvo, setRestrictionOvo] = useState(false);
  const [restrictionGluten, setRestrictionGluten] = useState(false);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [saving, setSaving] = useState(false);

  function toggleDislike(item: string) {
    setDislikes((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }
  function togglePrefer(item: string) {
    setPreferences((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }

  function applyGoalCalories() {
    const g = GOALS.find((x) => x.value === goal);
    if (g) {
      setCaloriesMin(g.calories[0]);
      setCaloriesMax(g.calories[1]);
    }
  }

  async function handleFinish() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login novamente.");
      setSaving(false);
      return;
    }

    const { error: anamErr } = await supabase.from("user_anamnesis").upsert(
      {
        user_id: user.id,
        goal,
        calories_min: caloriesMin,
        calories_max: caloriesMax,
        restriction_lactose: restrictionLactose,
        restriction_ovo: restrictionOvo,
        restriction_gluten: restrictionGluten,
        dislikes,
        preferences,
        meals_per_day: mealsPerDay,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (anamErr) {
      toast.error(anamErr.message);
      setSaving(false);
      return;
    }

    const { ok, error } = await ensureMealPlan(user.id);
    if (!ok) {
      toast.warning(error ?? "Plano gerado parcialmente. Você pode gerar em /hoje.");
    }

    toast.success("Perfil alimentar salvo. Gerando seu plano...");
    router.replace("/hoje");
    router.refresh();
    setSaving(false);
  }

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Anamnese alimentar"
        subtitle="Responda para personalizarmos seu plano (1º acesso)."
      />
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {step === 1 && (
        <Card>
          <CardBody>
            <div className="text-sm font-medium text-ink mb-2">Qual seu objetivo?</div>
            <div className="space-y-2">
              {GOALS.map((g) => (
                <label
                  key={g.value}
                  className="flex items-center gap-2 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
                >
                  <input
                    type="radio"
                    name="goal"
                    value={g.value}
                    checked={goal === g.value}
                    onChange={() => {
                      setGoal(g.value);
                      setCaloriesMin(g.calories[0]);
                      setCaloriesMax(g.calories[1]);
                    }}
                    className="text-primary-500"
                  />
                  <span>{g.label}</span>
                  <span className="text-xs text-zinc-500 ml-auto">
                    {g.calories[0]}-{g.calories[1]} kcal
                  </span>
                </label>
              ))}
            </div>
          </CardBody>
          <CardFooter>
            <Button className="w-full" onClick={() => setStep(2)}>
              Próximo
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardBody>
            <div className="text-sm font-medium text-ink mb-2">Faixa calórica (kcal/dia)</div>
            <p className="text-xs text-zinc-500 mb-3">
              Ajuste se quiser. O valor foi sugerido pelo objetivo.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1200}
                max={5000}
                value={caloriesMin}
                onChange={(e) => setCaloriesMin(Number(e.target.value))}
                className="w-24 rounded-xl border border-border px-3 py-2 text-sm"
              />
              <span className="text-zinc-500">a</span>
              <input
                type="number"
                min={1200}
                max={5000}
                value={caloriesMax}
                onChange={(e) => setCaloriesMax(Number(e.target.value))}
                className="w-24 rounded-xl border border-border px-3 py-2 text-sm"
              />
            </div>
          </CardBody>
          <CardFooter className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              Próximo
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardBody>
            <div className="text-sm font-medium text-ink mb-2">Restrições alimentares</div>
            <p className="text-xs text-zinc-500 mb-3">Marque o que você evita.</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restrictionLactose}
                  onChange={(e) => setRestrictionLactose(e.target.checked)}
                  className="rounded border-border text-primary-500"
                />
                <span>Sem lactose</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restrictionOvo}
                  onChange={(e) => setRestrictionOvo(e.target.checked)}
                  className="rounded border-border text-primary-500"
                />
                <span>Sem ovo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restrictionGluten}
                  onChange={(e) => setRestrictionGluten(e.target.checked)}
                  className="rounded border-border text-primary-500"
                />
                <span>Sem glúten</span>
              </label>
            </div>
          </CardBody>
          <CardFooter className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={() => setStep(4)}>
              Próximo
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardBody>
            <div className="text-sm font-medium text-ink mb-2">Não gosto de</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {DISLIKE_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleDislike(item)}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                    dislikes.includes(item)
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="text-sm font-medium text-ink mb-2">Prefiro</div>
            <div className="flex flex-wrap gap-2">
              {PREFER_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => togglePrefer(item)}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                    preferences.includes(item)
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </CardBody>
          <CardFooter className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(3)}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={() => setStep(5)}>
              Próximo
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardBody>
            <div className="text-sm font-medium text-ink mb-2">Refeições por dia</div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMealsPerDay((d) => Math.max(3, d - 1))}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
              >
                −
              </button>
              <span className="text-lg font-semibold tabular-nums">{mealsPerDay}</span>
              <button
                type="button"
                onClick={() => setMealsPerDay((d) => Math.min(6, d + 1))}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
              >
                +
              </button>
            </div>
          </CardBody>
          <CardFooter className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(4)}>
              Voltar
            </Button>
            <Button className="flex-1" onClick={handleFinish} disabled={saving}>
              {saving ? "Salvando…" : "Concluir"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
