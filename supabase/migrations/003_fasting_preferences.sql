-- Preferências de jejum (100% opcional, sem prescrever regime)
-- profiles: como o usuário prefere
alter table public.profiles
  add column if not exists fasting_enabled boolean default false,
  add column if not exists fasting_style text default 'nao', -- 'nao' | 'ocasional' | 'planejado'
  add column if not exists fasting_days_per_week int default 0,
  add column if not exists fasting_window text,               -- opcional: "12h", "14h", "16h"
  add column if not exists fasting_notes text;

-- daily_logs: registro do dia (se marcou jejum naquele dia)
alter table public.daily_logs
  add column if not exists fasting_today boolean default false,
  add column if not exists fasting_window text;
