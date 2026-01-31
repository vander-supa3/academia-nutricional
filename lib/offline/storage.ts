import localforage from "localforage";

export const offlineStore = localforage.createInstance({
  name: "academia-nutricional",
  storeName: "offline",
});

export type OfflineMutation =
  | {
      id: string;
      type: "UPSERT_DAILY_LOG";
      payload: {
        date: string;
        water_ml?: number;
        workout_done?: boolean;
        meals_logged?: boolean;
        weight_kg?: number | null;
        fasting_today?: boolean;
        fasting_window?: string | null;
      };
      createdAt: number;
    };

const QUEUE_KEY = "offline:queue";
const CACHE_KEY_PREFIX = "cache:";

export async function getQueue(): Promise<OfflineMutation[]> {
  return (await offlineStore.getItem<OfflineMutation[]>(QUEUE_KEY)) ?? [];
}

export async function setQueue(next: OfflineMutation[]) {
  await offlineStore.setItem(QUEUE_KEY, next);
}

export async function enqueue(m: OfflineMutation) {
  const q = await getQueue();
  q.push(m);
  await setQueue(q);
}

export async function removeFromQueue(ids: string[]) {
  const q = await getQueue();
  const next = q.filter((m) => !ids.includes(m.id));
  await setQueue(next);
}

export async function setCache<T>(key: string, value: T) {
  await offlineStore.setItem(CACHE_KEY_PREFIX + key, { value, ts: Date.now() });
}

export async function getCache<T>(key: string): Promise<{ value: T; ts: number } | null> {
  const raw = await offlineStore.getItem<{ value: T; ts: number }>(CACHE_KEY_PREFIX + key);
  return raw ?? null;
}
