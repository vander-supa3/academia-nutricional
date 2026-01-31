import Link from "next/link";
import { Flame, Check } from "lucide-react";

export function Landing() {
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
            <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center border border-primary-200">
              <Flame className="text-primary-600" size={32} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-ink">
              Academia Nutricional
            </h1>
            <p className="text-base text-zinc-600">
              Consistência diária, do seu jeito. Treino, refeições e bem-estar em um só app.
            </p>
          </div>
          <ul className="space-y-3 text-left max-w-sm mx-auto text-sm text-zinc-700">
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Check size={14} />
              </span>
              Plano do dia + treinos guiados e receitas baratas
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <Check size={14} />
              </span>
              Assistente com IA e uso offline (PWA)
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl bg-primary-500 text-white px-6 py-3.5 font-semibold shadow-card hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition"
            >
              Entrar
            </Link>
            <Link
              href="/precos"
              className="inline-flex items-center justify-center rounded-2xl border border-border bg-surface text-ink px-6 py-3.5 font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition"
            >
              Ver preços
            </Link>
          </div>
        </div>
      </div>
      <footer className="relative z-10 border-t border-border bg-white/90 py-6 px-4">
        <div className="mx-auto max-w-md flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-600">
          <Link href="/termos" className="hover:text-primary-600 underline">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="hover:text-primary-600 underline">
            Privacidade
          </Link>
          <a
            href="mailto:contato@academianutricional.app"
            className="hover:text-primary-600 underline"
          >
            Contato
          </a>
        </div>
      </footer>
    </div>
  );
}
