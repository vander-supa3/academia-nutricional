-- Thread do Assistente OpenAI por usuário (1 thread por user)
create table if not exists public.ai_threads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  thread_id text not null,
  updated_at timestamptz default now()
);

alter table public.ai_threads enable row level security;

create policy "ai_threads_select_own" on public.ai_threads
  for select using (auth.uid() = user_id);

create policy "ai_threads_insert_own" on public.ai_threads
  for insert with check (auth.uid() = user_id);

create policy "ai_threads_update_own" on public.ai_threads
  for update using (auth.uid() = user_id);
