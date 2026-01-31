"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getNotesLast14Days } from "@/lib/mealPlan";
import { Flame, Droplets, Dumbbell, MessageCircle, FileText } from "lucide-react";
import Link from "next/link";

const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_MSG = "Olá! Gostaria de agendar uma consulta individual com a nutricionista.";

export default function ProgressoPage() {
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["daily-logs", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(14);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: notesHistory = [] } = useQuery({
    queryKey: ["user-notes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return getNotesLast14Days(supabase, user.id);
    },
    enabled: !!user?.id,
  });

  const streak = (() => {
    if (logs.length === 0) return 0;
    let count = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (const log of logs) {
      const d = log.date as string;
      if (d > today) continue;
      if (d === today) { count++; continue; }
      const prev = new Date(today);
      prev.setDate(prev.getDate() - count - 1);
      const expected = prev.toISOString().slice(0, 10);
      if (d === expected) count++;
      else break;
    }
    return count;
  })();

  const workoutsDone = logs.filter((l) => l.workout_done).length;
  const avgWater = logs.length
    ? Math.round(logs.reduce((acc, l) => acc + (l.water_ml ?? 0), 0) / logs.length)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="border border-border rounded-xl shadow-card p-4 animate-pulse">
          <div className="h-6 bg-zinc-200 rounded w-1/3" />
          <div className="h-4 bg-zinc-200 rounded w-1/2 mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-xl shadow-card p-4">
        <div className="text-sm text-zinc-500">📈 Progresso</div>
        <div className="font-semibold text-lg text-ink mt-1">Resumo da semana</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-border rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 text-zinc-600">
            <Flame size={18} className="text-accent-500" />
            <span className="text-sm">Streak</span>
          </div>
          <div className="text-2xl font-bold text-ink mt-1">{streak} dias</div>
        </div>
        <div className="border border-border rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 text-zinc-600">
            <Dumbbell size={18} className="text-primary-500" />
            <span className="text-sm">Treinos (14 dias)</span>
          </div>
          <div className="text-2xl font-bold text-ink mt-1">{workoutsDone}</div>
        </div>
        <div className="border border-border rounded-xl shadow-card p-4">
          <div className="flex items-center gap-2 text-zinc-600">
            <Droplets size={18} className="text-blue-500" />
            <span className="text-sm">Média água</span>
          </div>
          <div className="text-2xl font-bold text-ink mt-1">{(avgWater / 1000).toFixed(1)}L</div>
        </div>
      </div>

      <div className="border border-border rounded-xl shadow-card p-4">
        <div className="text-sm text-zinc-500 mb-3">Últimos 14 dias (água / treino)</div>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-sm text-zinc-600">Nenhum registro ainda.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm"
              >
                <span className="text-zinc-600">{log.date as string}</span>
                <span className="text-zinc-500">
                  {(log.water_ml ?? 0) / 1000}L {log.workout_done ? "• ✅ Treino" : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Histórico de notas (últimos 14 dias) */}
      <div className="border border-border rounded-xl shadow-card p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
          <FileText size={18} />
          <span>Histórico de notas (últimos 14 dias)</span>
        </div>
        <div className="space-y-2">
          {notesHistory.length === 0 ? (
            <div className="text-sm text-zinc-600">Nenhuma nota ainda.</div>
          ) : (
            notesHistory.map((n) => (
              <div
                key={n.date}
                className="py-2 border-b border-border last:border-0 text-sm"
              >
                <span className="text-zinc-600 font-medium">{n.date}</span>
                <p className="text-zinc-600 mt-0.5 line-clamp-2">{n.content || "—"}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CTA Falar com a Nutricionista */}
      <div className="border border-primary-200 rounded-xl shadow-card p-4 bg-primary-50/50">
        <div className="flex items-center gap-2 text-primary-800 font-medium">
          <MessageCircle size={20} />
          <span>Falar com a Nutricionista</span>
        </div>
        <p className="text-sm text-zinc-600 mt-2">
          Consulta individual (valor à parte). O app é automatizado e não substitui acompanhamento profissional.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-green-700 transition"
          >
            Agendar pelo WhatsApp
          </a>
          <Link
            href="/consulta"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface text-ink px-4 py-2.5 text-sm font-medium hover:bg-muted transition"
          >
            Ver detalhes
          </Link>
        </div>
      </div>

      <div className="text-xs text-zinc-500 italic">
        Foque em consistência. Ajuste metas com segurança e, se possível, com orientação profissional.
      </div>
    </div>
  );
}
