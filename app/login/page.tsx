"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Flame } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  function getErrorMessage(err: unknown): string {
    if (!(err instanceof Error)) return "Algo deu errado. Tente de novo.";
    const msg = err.message.toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("fetch"))
      return "Não foi possível conectar ao servidor. Confira: (1) Projeto Supabase está ativo no dashboard? (2) .env.local com URL e chave corretos? (3) Internet/firewall.";
    if (msg.includes("invalid login") || msg.includes("invalid_credentials"))
      return "E-mail ou senha incorretos.";
    if (msg.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos.";
    if (msg.includes("password")) return "A senha deve ter no mínimo 6 caracteres.";
    if (msg.includes("signup") || msg.includes("already registered"))
      return "Este e-mail já está cadastrado. Tente entrar com sua senha.";
    return err.message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.replace("/hoje");
          router.refresh();
          return;
        }
        setMessage({
          type: "success",
          text: "Conta criada. Verifique seu e-mail e clique no link para confirmar. Depois use « Entrar » com seu e-mail e senha.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/hoje");
        router.refresh();
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh relative flex flex-col items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/fundo-academia.svg')" }}
        aria-hidden
      />
      <div className="relative z-10 min-h-dvh w-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <Flame className="text-primary-600" size={24} />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Academia Nutricional</h1>
          <p className="text-sm text-zinc-500 italic">Consistência diária, do seu jeito.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-border px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••"
            />
          </div>
          {message && (
            <div
              className={`rounded-xl px-4 py-2 text-sm ${
                message.type === "success" ? "bg-primary-50 text-primary-800" : "bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium shadow-sm transition duration-250 disabled:opacity-50 hover:bg-primary-600"
          >
            {loading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setIsSignUp((v) => !v); setMessage(null); }}
          className="w-full text-sm text-zinc-500 hover:text-primary-600 underline"
        >
          {isSignUp ? "Já tenho conta? Entrar." : "Não tem conta? Criar conta"}
        </button>
      </div>
      </div>
    </div>
  );
}
