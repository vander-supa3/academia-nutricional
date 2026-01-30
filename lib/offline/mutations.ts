import { enqueue } from "./storage";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export async function offlineUpsertDailyLog(payload: {
  date: string;
  water_ml?: number;
  workout_done?: boolean;
  meals_logged?: boolean;
  weight_kg?: number | null;
}) {
  await enqueue({
    id: uid(),
    type: "UPSERT_DAILY_LOG",
    payload,
    createdAt: Date.now(),
  });
}
