-- ============================================================
-- Passo 1 — recipes / workouts / workout_exercises: leitura pública
-- (Se RLS foi habilitado sem policy, ninguém consegue ler.)
-- ============================================================
alter table public.recipes enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;

drop policy if exists "recipes_read_all" on public.recipes;
create policy "recipes_read_all" on public.recipes
  for select using (true);

drop policy if exists "workouts_read_all" on public.workouts;
create policy "workouts_read_all" on public.workouts
  for select using (true);

drop policy if exists "workout_exercises_read_all" on public.workout_exercises;
create policy "workout_exercises_read_all" on public.workout_exercises
  for select using (true);

-- ============================================================
-- Passo 3 — Trigger: auto-criar profile ao criar usuário em auth.users
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Usuário'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Passo 3 — Policies mínimas (idempotentes: drop if exists + create)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.daily_plans enable row level security;
alter table public.plan_meals enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "plans_select_own" on public.daily_plans;
drop policy if exists "plans_write_own" on public.daily_plans;
drop policy if exists "daily_plans_all_own" on public.daily_plans;
create policy "daily_plans_all_own" on public.daily_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "plan_meals_select_own" on public.plan_meals;
drop policy if exists "plan_meals_write_own" on public.plan_meals;
drop policy if exists "plan_meals_all_own" on public.plan_meals;
create policy "plan_meals_all_own" on public.plan_meals
  for all
  using (
    exists (select 1 from public.daily_plans p where p.id = plan_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.daily_plans p where p.id = plan_id and p.user_id = auth.uid())
  );
