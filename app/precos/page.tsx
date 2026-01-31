import Link from "next/link";
import { Flame, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Preços | Academia Nutricional",
  description:
    "R$ 19,90/mês. Plano do dia, treinos guiados, receitas baratas, assistente com IA e uso offline.",
};

export default function PrecosPage() {
  const benefits = [
    "Plano do dia personalizado (7 dias)",
    "Treinos guiados com timer",
    "Receitas baratas e práticas",
    "Assistente com IA (SSE, sem travar)",
    "Uso offline e PWA",
  ];

  return (
    <div className="min-h-dvh relative flex flex-col">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/fundo-academia.svg')" }}
        aria-hidden
      />
      <div className="relative z-10 min-h-dvh flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm px-4 py-12">
        <div className="w-full max-w-md mx-auto text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-primary-100 flex items-center justify-center border border-primary-200">
              <Flame className="text-primary-600" size={28} />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-ink">Planos</h1>
            <p className="text-zinc-600">Acesso completo por mês.</p>
          </div>
          <div className="rounded-2xl border-2 border-primary-200 bg-primary-50/80 p-6">
            <div className="text-3xl font-bold text-primary-700">R$ 19,90</div>
            <div className="text-sm text-zinc-600 mt-0.5">por mês</div>
            <ul className="mt-6 space-y-3 text-left text-sm text-zinc-700">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-200 text-primary-700">
                    <Check size={12} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <Link href="/login?plano=mensal" className="mt-6 block">
              <Button className="w-full">Assinar</Button>
            </Link>
          </div>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-primary-600 underline"
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
