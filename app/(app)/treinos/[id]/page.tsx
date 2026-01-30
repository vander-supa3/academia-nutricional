"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, Dumbbell, Play } from "lucide-react";

type Workout = {
  id: string;
  title: string;
  focus: string;
  minutes: number;
  level: string;
  equipment: string;
  description: string | null;
};

type Exercise = {
  id: string;
  name: string;
  seconds: number;
  order_index: number;
};

export default function WorkoutDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: workout, isLoading, error } = useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      const { data, error: e } = await supabase.from("workouts").select("*").eq("id", id).single();
      if (e) throw e;
      return data as Workout;
    },
    enabled: !!id,
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ["workout-exercises", id],
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", id)
        .order("order_index", { ascending: true });
      if (e) throw e;
      return (data ?? []) as Exercise[];
    },
    enabled: !!id,
  });

  if (isLoading || !workout) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-zinc-200 rounded animate-pulse" />
        <div className="border border-border rounded-xl shadow-card p-4 animate-pulse">
          <div className="h-6 bg-zinc-200 rounded w-3/4" />
          <div className="h-4 bg-zinc-200 rounded w-1/2 mt-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-border rounded-xl shadow-card p-4 text-sm text-red-600">
        Treino não encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/treinos"
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-primary-600"
      >
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div className="border border-border rounded-xl shadow-card p-4">
        <div className="font-semibold text-lg text-ink">{workout.title}</div>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-zinc-600">
          <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded">{workout.focus}</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {workout.minutes} min</span>
          <span>{workout.level}</span>
          <span>{workout.equipment}</span>
        </div>
        {workout.description && (
          <p className="text-sm text-zinc-600 mt-3">{workout.description}</p>
        )}
      </div>

      <div className="border border-border rounded-xl shadow-card p-4">
        <div className="text-sm text-zinc-500 mb-3">Exercícios ({exercises.length})</div>
        <ul className="space-y-2">
          {exercises.map((ex, i) => (
            <li key={ex.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="font-medium text-ink">{i + 1}. {ex.name}</span>
              <span className="text-sm text-zinc-500">{ex.seconds}s</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={`/treino-guiado/${workout.id}`}
        className="flex items-center justify-center gap-2 w-full bg-primary-500 text-white py-3 rounded-xl font-medium shadow-card transition duration-250 hover:bg-primary-600"
      >
        <Play size={20} /> Começar treino
      </Link>
    </div>
  );
}
