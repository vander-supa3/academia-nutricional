"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { cachedFetch } from "@/lib/offline/cachedQuery";
import { useOnline } from "@/lib/offline/useOnline";
import { Search } from "lucide-react";

type Recipe = {
  id: string;
  title: string;
  meal_type: string;
  kcal: number | null;
  cheap: boolean | null;
  ingredients: string | null;
  instructions: string | null;
};

const MEAL_TYPES = ["Café da manhã", "Almoço", "Jantar", "Lanche"];

function RecipeCardSkeleton() {
  return (
    <div className="border border-border rounded-xl shadow-card p-4 animate-pulse">
      <div className="h-4 bg-zinc-200 rounded w-2/3" />
      <div className="h-3 bg-zinc-200 rounded w-1/2 mt-2" />
      <div className="h-3 bg-zinc-200 rounded w-full mt-2" />
    </div>
  );
}

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
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="border border-border rounded-xl shadow-card p-4 space-y-3">
          <p className="text-sm text-red-600">
            Erro ao carregar receitas. Confira: (1) Tabela &quot;recipes&quot; existe no Supabase? (rode <code className="text-xs bg-zinc-100 px-1 rounded">supabase/schema.sql</code>), (2) Rodou <code className="text-xs bg-zinc-100 px-1 rounded">npm run seed:global</code>? (3) Conexão com a internet.
          </p>
          <p className="text-xs font-mono text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 break-all">
            Causa: {(error as Error)?.message ?? String(error)}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-muted transition"
          >
            Tentar de novo
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-xl shadow-card p-4 text-sm text-zinc-600">
          Nenhuma receita encontrada. Rode o seed global (npm run seed:global).
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="border border-border rounded-xl shadow-card p-4 transition duration-250"
            >
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
          ))}
        </div>
      )}
    </div>
  );
}
