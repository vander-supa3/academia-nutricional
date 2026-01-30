-- Academia Nutricional / BemVida Fit — Schema completo
-- Rodar no Supabase: SQL Editor → New query → colar e executar

-- 1) Perfis
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  goal text default 'Consistência e bem-estar',
  created_at timestamptz default now()
);

-- 2) Planos diários (pré-carregados + do usuário)
create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  day_index int not null,
  title text not null,
  workout_title text not null,
  workout_minutes int not null default 20,
  water_goal_ml int not null default 2500,
  kcal_min int default 1800,
  kcal_max int default 2200,
  created_at timestamptz default now()
);

-- 3) Biblioteca de treinos
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  focus text not null,
  minutes int not null,
  level text default 'Iniciante',
  equipment text default 'Sem equipamento',
  cover_url text,
  description text,
  created_at timestamptz default now()
);

-- 4) Exercícios do treino
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references public.workouts(id) on delete cascade,
  name text not null,
  seconds int not null,
  order_index int not null
);

-- 5) Receitas
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meal_type text not null,
  kcal int,
  cheap boolean default true,
  cover_url text,
  ingredients text,
  instructions text
);

-- 6) Refeições no dia (plano -> itens)
create table if not exists public.plan_meals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.daily_plans(id) on delete cascade,
  meal_type text not null,
  recipe_title text not null,
  kcal int,
  order_index int not null
);

-- 7) Logs do usuário (água, treinos, peso opcional)
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  water_ml int default 0,
  workout_done boolean default false,
  meals_logged boolean default false,
  weight_kg numeric,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- 8) Desafios / ranking
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  active boolean default true
);

create table if not exists public.challenge_members (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  points int default 0,
  unique(challenge_id, user_id)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.daily_plans enable row level security;
alter table public.daily_logs enable row level security;
alter table public.challenge_members enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_upsert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);

create policy "plans_select_own" on public.daily_plans
for select using (auth.uid() = user_id);

create policy "plans_write_own" on public.daily_plans
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "logs_select_own" on public.daily_logs
for select using (auth.uid() = user_id);

create policy "logs_write_own" on public.daily_logs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Biblioteca pública
alter table public.workouts disable row level security;
alter table public.workout_exercises disable row level security;
alter table public.recipes disable row level security;
alter table public.plan_meals enable row level security;

create policy "plan_meals_select_own" on public.plan_meals
for select using (
  exists(
    select 1 from public.daily_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  )
);

create policy "plan_meals_write_own" on public.plan_meals
for all using (
  exists(
    select 1 from public.daily_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  )
) with check (
  exists(
    select 1 from public.daily_plans p
    where p.id = plan_id and p.user_id = auth.uid()
  )
);
