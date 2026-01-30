"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { cachedFetch } from "@/lib/offline/cachedQuery";
import { useOnline } from "@/lib/offline/useOnline";
import { Dumbbell, Search, Clock } from "lucide-react";

type Workout = {
  id: string;
  title: string;
  focus: string;
  minutes: number;
  level: string;
  equipment: string;
  description: string | null;
};

function WorkoutCardSkeleton() {
  return (
    <div className="border border-border rounded-xl shadow-card p-4 animate-pulse">
      <div className="h-4 bg-zinc-200 rounded w-2/3" />
      <div className="h-3 bg-zinc-200 rounded w-1/2 mt-2" />
      <div className="h-3 bg-zinc-200 rounded w-1/4 mt-2" />
    </div>
  );
}

export function WorkoutsPage() {
  const [search, setSearch] = useState("");
  const [filterFocus, setFilterFocus] = useState<string>("");
  const online = useOnline();

  const { data: workouts = [], isLoading, error } = useQuery({
    queryKey: ["workouts"],
    queryFn: async () => {
      const res = await cachedFetch({
        key: "workouts",
        fetcher: async () => {
          const { data, error: e } = await supabase.from("workouts").select("*").order("title");
          if (e) throw e;
          return (data ?? []) as Workout[];
        },
      });
      return res.data;
    },
  });

  const focuses = Array.from(new Set(workouts.map((w) => w.focus))).sort();
  const filtered = workouts.filter((w) => {
    const matchSearch = !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.focus.toLowerCase().includes(search.toLowerCase());
    const matchFocus = !filterFocus || w.focus === filterFocus;
    return matchSearch && matchFocus;
  });

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-xl shadow-card p-4">
        <div className="font-semibold text-lg">Biblioteca de treinos</div>
        <div className="text-sm text-zinc-600 mt-1 flex items-center justify-between gap-2">
          <span>30 treinos. Filtre por foco e busque por nome.</span>
          {!online && (
            <span className="text-xs text-zinc-500 whitespace-nowrap">Offline • dados salvos</span>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar treino..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-ink placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterFocus("")}
          className={`px-3 py-1.5 rounded-lg text-sm border transition duration-250 ${
            !filterFocus ? "bg-primary-500 text-white border-primary-500" : "border-border text-zinc-600 hover:bg-muted"
          }`}
        >
          Todos
        </button>
        {focuses.map((f) => (
          <button
            key={f}
            onClick={() => setFilterFocus(f)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition duration-250 ${
              filterFocus === f ? "bg-primary-500 text-white border-primary-500" : "border-border text-zinc-600 hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <WorkoutCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="border border-border rounded-xl shadow-card p-4 text-sm text-red-600">
          Erro ao carregar treinos. Tente de novo.
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-xl shadow-card p-4 text-sm text-zinc-600">
          Nenhum treino encontrado. Ajuste o filtro ou a busca.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <Link
              key={w.id}
              href={`/treinos/${w.id}`}
              className="block border border-border rounded-xl shadow-card p-4 transition duration-250 hover:shadow-md"
            >
              <div className="font-semibold text-ink">{w.title}</div>
              <div className="flex items-center gap-2 mt-1 text-sm text-zinc-600">
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded">{w.focus}</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {w.minutes} min
                </span>
                <span>{w.level}</span>
              </div>
              {w.description && (
                <div className="text-sm text-zinc-500 mt-2 line-clamp-2">{w.description}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
