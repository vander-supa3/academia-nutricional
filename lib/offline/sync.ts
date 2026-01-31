import { supabase } from "@/lib/supabase";
import { getQueue, removeFromQueue, type OfflineMutation } from "./storage";

export async function syncOfflineQueue(): Promise<{ synced: number }> {
  const q = await getQueue();
  if (!q.length) return { synced: 0 };

  const toSync: OfflineMutation[] = [...q];
  const syncedIds: string[] = [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { synced: 0 };

  for (const m of toSync) {
    if (m.type === "UPSERT_DAILY_LOG") {
      const { date, ...rest } = m.payload;
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .maybeSingle();
      const merged = { ...(existing ?? {}), ...rest };
      const { error } = await supabase.from("daily_logs").upsert(
        { user_id: user.id, date, ...merged },
        { onConflict: "user_id,date" }
      );
      if (!error) syncedIds.push(m.id);
    }
  }

  if (syncedIds.length) await removeFromQueue(syncedIds);
  return { synced: syncedIds.length };
}
