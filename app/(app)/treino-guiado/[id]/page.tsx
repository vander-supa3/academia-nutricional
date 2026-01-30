"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { offlineUpsertDailyLog } from "@/lib/offline/mutations";
import { ArrowLeft, Pause, Play, SkipBack, SkipForward } from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  seconds: number;
  order_index: number;
};

export default function TreinoGuiadoPage() {
  const params = useParams();
  const id = params.id as string;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const { data: workout } = useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("workouts").select("*").eq("id", id).single();
      if (error) throw error;
      return data as { id: string; title: string };
    },
    enabled: !!id,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ["workout-exercises", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", id)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Exercise[];
    },
    enabled: !!id,
  });

  const currentExercise = exercises[currentIndex];
  const totalExercises = exercises.length;

  useEffect(() => {
    if (currentExercise) setSecondsLeft(currentExercise.seconds);
  }, [currentIndex, currentExercise?.id]);

  useEffect(() => {
    if (!isRunning || !currentExercise) return;
    if (secondsLeft <= 0) {
      if (currentIndex < totalExercises - 1) {
        setCurrentIndex((i) => i + 1);
        setSecondsLeft(exercises[currentIndex + 1]?.seconds ?? 0);
      } else {
        setIsRunning(false);
        setIsDone(true);
        markWorkoutDone();
        toast.success("Treino concluído!");
      }
      return;
    }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- currentExercise is derived from exercises[currentIndex], avoid loop
  }, [isRunning, secondsLeft, currentIndex, totalExercises, exercises]);

  async function markWorkoutDone() {
    const today = new Date().toISOString().slice(0, 10);
    const online = typeof navigator !== "undefined" && navigator.onLine;
    if (!online) {
      await offlineUpsertDailyLog({ date: today, workout_done: true });
      toast.success("Salvo offline. Sincroniza quando voltar a conexão.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("daily_logs").upsert(
      { user_id: user.id, date: today, workout_done: true },
      { onConflict: "user_id,date" }
    );
  }

  if (!workout || exercises.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-zinc-200 rounded animate-pulse" />
        <div className="border border-border rounded-xl p-4 animate-pulse">
          <div className="h-6 bg-zinc-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="space-y-4">
        <div className="border border-border rounded-xl shadow-card p-6 text-center">
          <div className="text-2xl font-semibold text-primary-600">Treino concluído!</div>
          <p className="text-sm text-zinc-600 mt-2">{workout.title}</p>
          <Link
            href="/hoje"
            className="inline-block mt-4 bg-primary-500 text-white px-6 py-2 rounded-xl font-medium"
          >
            Voltar ao Hoje
          </Link>
        </div>
      </div>
    );
  }

  const progress = totalExercises ? ((currentIndex + 1) / totalExercises) * 100 : 0;

  return (
    <div className="space-y-6">
      <Link
        href={`/treinos/${id}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-primary-600"
      >
        <ArrowLeft size={16} /> Sair
      </Link>

      <div className="border border-border rounded-xl shadow-card p-4">
        <div className="text-sm text-zinc-500">{workout.title}</div>
        <div className="text-2xl font-semibold text-ink mt-1">
          {currentExercise?.name ?? "—"}
        </div>
        <div className="text-4xl font-mono font-bold text-primary-600 mt-4 tabular-nums">
          {secondsLeft}s
        </div>
      </div>

      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-250"
          style={{ width: `${100 - (currentExercise ? (secondsLeft / currentExercise.seconds) * 100 : 0)}%` }}
        />
      </div>
      <div className="text-xs text-zinc-500 text-center">
        Exercício {currentIndex + 1} de {totalExercises}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex((i) => i - 1);
              setSecondsLeft(exercises[currentIndex - 1].seconds);
            }
          }}
          disabled={currentIndex === 0}
          className="p-3 rounded-xl border border-border disabled:opacity-40"
        >
          <SkipBack size={24} />
        </button>
        <button
          onClick={() => setIsRunning((r) => !r)}
          className="p-4 rounded-xl bg-primary-500 text-white"
        >
          {isRunning ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <button
          onClick={() => {
            if (currentIndex < totalExercises - 1) {
              setCurrentIndex((i) => i + 1);
              setSecondsLeft(exercises[currentIndex + 1].seconds);
            }
          }}
          disabled={currentIndex >= totalExercises - 1}
          className="p-3 rounded-xl border border-border disabled:opacity-40"
        >
          <SkipForward size={24} />
        </button>
      </div>
    </div>
  );
}
