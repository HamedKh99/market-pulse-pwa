import type { TickData, SymbolConfig, SparklineData } from "@/types/market";

const CACHE_KEY = "mp-offline-cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes max stale

interface OfflineCache {
  prices: Record<string, TickData>;
  sparklines: Record<string, SparklineData>;
  symbols: SymbolConfig[];
  timestamp: number;
}

/**
 * Persist a snapshot of current market data to localStorage.
 * Called periodically (every 5 seconds) from the DataProvider,
 * NOT on every tick — avoids thrashing localStorage.
 */
export function saveOfflineSnapshot(data: Omit<OfflineCache, "timestamp">): void {
  try {
    const cache: OfflineCache = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage might be full — silently fail
    console.warn("[OfflineCache] Failed to save snapshot");
  }
}

/**
 * Load the cached snapshot. Returns null if:
 * - No cache exists
 * - Cache is older than CACHE_TTL_MS
 */
export function loadOfflineSnapshot(): OfflineCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as OfflineCache;
    const age = Date.now() - cache.timestamp;

    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cache;
  } catch {
    return null;
  }
}

/**
 * Get the age of the cached data in a human-readable format.
 */
export function getCacheAge(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as OfflineCache;
    const age = Date.now() - cache.timestamp;

    if (age < 1000) return "just now";
    if (age < 60_000) return `${Math.floor(age / 1000)}s ago`;
    if (age < 3_600_000) return `${Math.floor(age / 60_000)}m ago`;
    return "stale";
  } catch {
    return null;
  }
}
