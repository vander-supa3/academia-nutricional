"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Flame, Home, Salad, Dumbbell, Download, TrendingUp } from "lucide-react";
import { useAutoSync } from "@/lib/offline/useAutoSync";

export function AppShell({ children }: { children: ReactNode }) {
  useAutoSync();
  return (
    <div className="min-h-dvh relative text-zinc-900">
      {/* Papel de parede */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/fundo-academia.svg')" }}
        aria-hidden
      />
      {/* Camada para legibilidade do conteúdo */}
      <div className="relative z-10 min-h-dvh bg-white/80 backdrop-blur-[1px]">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary-100 flex items-center justify-center">
            <Flame className="text-primary-600" size={18} />
          </div>
          <div className="leading-tight">
            <div className="font-semibold">Academia Nutricional</div>
            <div className="text-xs text-zinc-500 italic">Consistência diária, do seu jeito.</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-white">
        <div className="mx-auto max-w-md px-2 py-2 flex items-center justify-between text-[10px] gap-0">
          <Link className="flex flex-col items-center gap-0.5 text-zinc-600 hover:text-primary-600 min-w-0 flex-1" href="/hoje">
            <Home size={18} /> Hoje
          </Link>
          <Link className="flex flex-col items-center gap-0.5 text-zinc-600 hover:text-primary-600 min-w-0 flex-1" href="/treinos">
            <Dumbbell size={18} /> Treinos
          </Link>
          <Link className="flex flex-col items-center gap-0.5 text-zinc-600 hover:text-primary-600 min-w-0 flex-1" href="/refeicoes">
            <Salad size={18} /> Refeições
          </Link>
          <Link className="flex flex-col items-center gap-0.5 text-zinc-600 hover:text-primary-600 min-w-0 flex-1" href="/progresso">
            <TrendingUp size={18} /> Progresso
          </Link>
          <Link className="flex flex-col items-center gap-0.5 text-zinc-600 hover:text-primary-600 min-w-0 flex-1" href="/install">
            <Download size={18} /> Instalar
          </Link>
        </div>
      </nav>

      <Link
        href="/treinos"
        className="fixed bottom-20 right-4 md:right-[calc(50%-14rem)] bg-primary-500 text-white px-4 py-3 rounded-xl shadow-card transition duration-250 active:scale-[0.98] text-sm font-medium"
      >
        Começar treino
      </Link>
      </div>
    </div>
  );
}
