"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Home,
  Salad,
  Dumbbell,
  Download,
  TrendingUp,
  CloudOff,
  Settings,
  MessageCircle,
} from "lucide-react";
import { useAutoSync } from "@/lib/offline/useAutoSync";
import { useOnline } from "@/lib/offline/useOnline";
import { Badge } from "@/components/ui/Badge";
import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/hoje", label: "Hoje", icon: Home },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/refeicoes", label: "Refeições", icon: Salad },
  { href: "/progresso", label: "Progresso", icon: TrendingUp },
  { href: "/assistente", label: "Assistente", icon: MessageCircle },
  { href: "/configuracoes", label: "Config", icon: Settings },
  { href: "/install", label: "Instalar", icon: Download },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useAutoSync();
  const online = useOnline();
  const pathname = usePathname();

  const navLink = (link: (typeof NAV_LINKS)[number]) => {
    const Icon = link.icon;
    const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          isActive
            ? "bg-primary-100 text-primary-700"
            : "text-zinc-600 hover:bg-muted hover:text-primary-600"
        )}
      >
        <Icon size={20} />
        {link.label}
      </Link>
    );
  };

  return (
    <div className="min-h-dvh relative text-zinc-900 flex">
      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/fundo-academia.svg')" }}
        aria-hidden
      />
      <div className="relative z-10 min-h-dvh flex-1 flex flex-col md:flex-row bg-white/80 backdrop-blur-[1px]">
        {/* Sidebar: md+ */}
        <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:border-r md:border-border md:bg-white/95">
          <div className="md:sticky md:top-0 md:flex md:flex-col md:min-h-dvh md:py-4">
            <div className="px-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-primary-100 flex items-center justify-center border border-border shrink-0">
                  <Flame className="text-primary-600" size={20} />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="font-semibold text-ink">Academia Nutricional</div>
                  <div className="text-xs text-zinc-500 italic">Consistência diária</div>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-0.5">
              {NAV_LINKS.map((link) => navLink(link))}
            </nav>
            <div className="px-2 pt-4 border-t border-border">
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-border">
            <div className="mx-auto w-full max-w-md md:max-w-2xl xl:max-w-5xl px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 md:hidden">
                <div className="h-9 w-9 rounded-2xl bg-primary-100 flex items-center justify-center border border-border shrink-0">
                  <Flame className="text-primary-600" size={18} />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="font-semibold">Academia Nutricional</div>
                  <div className="text-xs text-zinc-500 italic">Consistência diária, do seu jeito.</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!online && (
                  <Badge tone="warning" className="shrink-0 hidden sm:inline-flex">
                    <CloudOff size={14} />
                    <span className="whitespace-nowrap">Offline</span>
                  </Badge>
                )}
                <Link
                  href="/treinos"
                  className="rounded-xl bg-primary-500 text-white px-4 py-2.5 text-sm font-medium shadow-card hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition md:ml-auto"
                >
                  Começar treino
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-md md:max-w-2xl xl:max-w-5xl px-4 py-4 pb-24 md:pb-8">
            {children}
            <p className="mt-6 text-center text-[11px] text-zinc-500 italic">
              Este app não substitui orientação médica ou nutricional. Consulte um profissional de saúde.
            </p>
          </main>

          {/* Bottom nav: mobile only */}
          <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-white md:hidden z-10">
            <div className="mx-auto max-w-md px-2 py-2 flex items-center justify-between text-[10px] gap-0">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 min-w-0 flex-1 py-1",
                      isActive ? "text-primary-600" : "text-zinc-600 hover:text-primary-600"
                    )}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Floating CTA: mobile only */}
          <Link
            href="/treinos"
            className="fixed bottom-20 right-4 md:hidden z-10 bg-primary-500 text-white px-4 py-3 rounded-xl shadow-card transition duration-250 active:scale-[0.98] text-sm font-medium"
          >
            Começar treino
          </Link>
        </div>
      </div>
    </div>
  );
}
