-- Assinaturas (para paywall quando integrar gateway)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'inactive', -- active | canceled | past_due | trialing | inactive
  plan text default 'mensal',
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  provider text, -- stripe | mercadopago | hotmart | etc
  provider_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- insert/update apenas via service role ou webhook (backend)
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);

create policy "subscriptions_update_own" on public.subscriptions
  for update using (auth.uid() = user_id);
