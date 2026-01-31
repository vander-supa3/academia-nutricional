-- ============================================================
-- Módulo alimentação V1: anamnese, templates, plano por usuário, notas, consumo
-- ============================================================

-- 1) Anamnese alimentar (onboarding)
create table if not exists public.user_anamnesis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null check (goal in ('emagrecer', 'hipertrofia', 'manter')),
  calories_min int not null,
  calories_max int not null,
  restriction_lactose boolean default false,
  restriction_ovo boolean default false,
  restriction_gluten boolean default false,
  dislikes text[] default '{}',
  preferences text[] default '{}',
  meals_per_day int not null check (meals_per_day >= 3 and meals_per_day <= 6),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- 2) Templates de plano (por objetivo/calorias/refeições por dia)
create table if not exists public.meal_plan_templates (
  id uuid primary key default gen_random_uuid(),
  goal text not null check (goal in ('emagrecer', 'hipertrofia', 'manter')),
  calories_min int not null,
  calories_max int not null,
  meals_per_day int not null,
  name text not null
);

-- 3) Refeições do template (por dia 0-6)
create table if not exists public.template_meals (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.meal_plan_templates(id) on delete cascade,
  day_index int not null check (day_index >= 0 and day_index <= 6),
  meal_type text not null,
  recipe_id uuid not null references public.recipes(id) on delete restrict,
  portion_multiplier numeric default 1,
  order_index int not null
);

-- 4) Plano do usuário por data (1 por dia)
create table if not exists public.user_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  template_id uuid references public.meal_plan_templates(id) on delete set null,
  calories_target int not null,
  goal text not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- 5) Itens do plano do dia (com troca)
create table if not exists public.user_meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_meal_plan_id uuid not null references public.user_meal_plans(id) on delete cascade,
  meal_type text not null,
  recipe_id uuid not null references public.recipes(id) on delete restrict,
  order_index int not null,
  is_swapped boolean default false,
  swapped_from_recipe_id uuid references public.recipes(id) on delete set null
);

-- 6) Notas do usuário por data
create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  content text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- 7) Consumo (marcar refeição como consumida)
create table if not exists public.meal_consumption_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  user_meal_plan_item_id uuid references public.user_meal_plan_items(id) on delete set null,
  meal_type text not null,
  recipe_id uuid not null references public.recipes(id) on delete restrict,
  consumed_at timestamptz default now()
);

-- 8) recipes: campo opcional image_url (V1.1)
alter table public.recipes
  add column if not exists image_url text;

-- Indexes
create index if not exists idx_user_anamnesis_user_id on public.user_anamnesis(user_id);
create index if not exists idx_meal_plan_templates_goal_cal on public.meal_plan_templates(goal, calories_min, calories_max);
create index if not exists idx_template_meals_template_day on public.template_meals(template_id, day_index);
create index if not exists idx_user_meal_plans_user_date on public.user_meal_plans(user_id, date);
create index if not exists idx_user_meal_plan_items_plan on public.user_meal_plan_items(user_meal_plan_id);
create index if not exists idx_user_notes_user_date on public.user_notes(user_id, date);
create index if not exists idx_meal_consumption_user_date on public.meal_consumption_logs(user_id, date);

-- RLS
alter table public.user_anamnesis enable row level security;
alter table public.meal_plan_templates enable row level security;
alter table public.template_meals enable row level security;
alter table public.user_meal_plans enable row level security;
alter table public.user_meal_plan_items enable row level security;
alter table public.user_notes enable row level security;
alter table public.meal_consumption_logs enable row level security;

-- user_anamnesis: próprio usuário
create policy "user_anamnesis_select_own" on public.user_anamnesis for select using (auth.uid() = user_id);
create policy "user_anamnesis_insert_own" on public.user_anamnesis for insert with check (auth.uid() = user_id);
create policy "user_anamnesis_update_own" on public.user_anamnesis for update using (auth.uid() = user_id);

-- meal_plan_templates: leitura pública (sistema)
create policy "meal_plan_templates_select_all" on public.meal_plan_templates for select using (true);

-- template_meals: leitura pública
create policy "template_meals_select_all" on public.template_meals for select using (true);

-- user_meal_plans: próprio usuário
create policy "user_meal_plans_all_own" on public.user_meal_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_meal_plan_items: via plano do usuário
create policy "user_meal_plan_items_all_own" on public.user_meal_plan_items for all
  using (exists (select 1 from public.user_meal_plans p where p.id = user_meal_plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.user_meal_plans p where p.id = user_meal_plan_id and p.user_id = auth.uid()));

-- user_notes: próprio usuário
create policy "user_notes_all_own" on public.user_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- meal_consumption_logs: próprio usuário
create policy "meal_consumption_all_own" on public.meal_consumption_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- meal_plan_templates e template_meals: insert/update apenas service role (seed)
-- Não criamos policy de insert para templates; usar service role no seed.
