"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPage() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  const isIOS = useMemo(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }, []);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone
    ) {
      setInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-xl shadow-sm p-4">
        <div className="font-semibold text-lg">Instalar o app</div>
        <div className="text-sm text-zinc-600 mt-1">
          Treine onde estiver, economize e acompanhe sua evolução mesmo offline.
        </div>
      </div>

      {installed ? (
        <div className="border border-border rounded-xl shadow-sm p-4">
          ✅ Parece que o app já está instalado neste dispositivo.
        </div>
      ) : (
        <div className="border border-border rounded-xl shadow-sm p-4 space-y-3">
          {!isIOS && (
            <button
              onClick={handleInstall}
              disabled={!deferred}
              className="w-full bg-primary-500 text-white py-3 rounded-xl shadow-sm transition duration-250 disabled:opacity-50 font-medium"
            >
              Instalar App
            </button>
          )}

          {isIOS && (
            <div className="text-sm text-zinc-700 space-y-2">
              <div className="font-medium">No iPhone (Safari):</div>
              <ol className="list-decimal pl-5 text-zinc-600 space-y-1">
                <li>Abra no Safari</li>
                <li>Toque em Compartilhar</li>
                <li>Selecione &quot;Adicionar à Tela de Início&quot;</li>
              </ol>
            </div>
          )}

          <div className="text-xs text-zinc-500">
            Dica: o modo offline mantém seus treinos e registros recentes disponíveis.
          </div>
        </div>
      )}
    </div>
  );
}
