import { getCache, setCache } from "./storage";

export async function cachedFetch<T>({
  key,
  fetcher,
  maxAgeMs = 1000 * 60 * 60 * 24,
}: {
  key: string;
  fetcher: () => Promise<T>;
  maxAgeMs?: number;
}): Promise<{ data: T; fromCache: boolean }> {
  const cached = await getCache<T>(key);
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  if (isOffline && cached?.value != null) {
    return { data: cached.value, fromCache: true };
  }

  try {
    const data = await fetcher();
    await setCache(key, data);
    return { data, fromCache: false };
  } catch (e) {
    if (cached?.value != null) {
      return { data: cached.value, fromCache: true };
    }
    throw e;
  }
}
