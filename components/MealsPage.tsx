"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { cachedFetch } from "@/lib/offline/cachedQuery";
import { useOnline } from "@/lib/offline/useOnline";
import { Search } from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

type Recipe = {
  id: string;
  title: string;
  meal_type: string;
  kcal: number | null;
  cheap: boolean | null;
  ingredients: string | null;
  instructions: string | null;
  image_url?: string | null;
};

const MEAL_TYPES = ["Café da manhã", "Almoço", "Jantar", "Lanche"];

export function MealsPage() {
  const [search, setSearch] = useState("");
  const [filterMeal, setFilterMeal] = useState<string>("");
  const online = useOnline();

  const { data: recipes = [], isLoading, error, refetch } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const res = await cachedFetch({
        key: "recipes",
        fetcher: async () => {
          const { data, error: e } = await supabase.from("recipes").select("*").order("meal_type", { ascending: true });
          if (e) {
            console.error("Supabase recipes error:", e);
            throw e;
          }
          return (data ?? []) as Recipe[];
        },
      });
      return res.data;
    },
    retry: 1,
  });

  const filtered = recipes.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.meal_type && r.meal_type.toLowerCase().includes(search.toLowerCase()));
    const matchMeal = !filterMeal || r.meal_type === filterMeal;
    return matchSearch && matchMeal;
  });

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-xl shadow-card p-4">
        <div className="font-semibold text-lg">Receitas baratas</div>
        <div className="text-sm text-zinc-600 mt-1 flex items-center justify-between gap-2">
          <span>20 receitas. Filtre por tipo e busque por nome.</span>
          {!online && (
            <span className="text-xs text-zinc-500 whitespace-nowrap">Offline • dados salvos</span>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input
          type="text"
          placeholder="Buscar receita..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface text-ink placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterMeal("")}
          className={`px-3 py-1.5 rounded-lg text-sm border transition duration-250 ${
            !filterMeal ? "bg-primary-500 text-white border-primary-500" : "border-border text-zinc-600 hover:bg-muted"
          }`}
        >
          Todos
        </button>
        {MEAL_TYPES.map((m) => (
          <button
            key={m}
            onClick={() => setFilterMeal(m)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition duration-250 ${
              filterMeal === m ? "bg-primary-500 text-white border-primary-500" : "border-border text-zinc-600 hover:bg-muted"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Erro ao carregar receitas"
          message={(error as Error)?.message ?? String(error)}
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
            >
              Tentar de novo
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma receita encontrada"
          description="Rode o seed global (npm run seed:global) ou ajuste os filtros."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-muted transition"
            >
              Atualizar
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="border border-border rounded-xl shadow-card p-4 transition duration-250 flex gap-3"
            >
              <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center text-zinc-400 text-2xl">
                {r.image_url ? (
                  <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span aria-hidden>🍽️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-ink">{r.title}</div>
                    <div className="text-sm text-zinc-600 mt-0.5">{r.meal_type}</div>
                  </div>
                  {r.kcal != null && (
                    <span className="text-sm text-zinc-500 whitespace-nowrap">{r.kcal} kcal</span>
                  )}
                </div>
                {r.ingredients && (
                  <div className="text-sm text-zinc-500 mt-2 line-clamp-2">{r.ingredients}</div>
                )}
                {r.instructions && (
                  <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{r.instructions}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
