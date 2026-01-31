-- Índices para produção (performance em queries por usuário e data)
-- Rodar no Supabase SQL Editor após 001 / schema inicial

CREATE INDEX IF NOT EXISTS idx_daily_plans_user_day
  ON public.daily_plans (user_id, day_index);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date
  ON public.daily_logs (user_id, date);

CREATE INDEX IF NOT EXISTS idx_plan_meals_plan
  ON public.plan_meals (plan_id);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout
  ON public.workout_exercises (workout_id);
