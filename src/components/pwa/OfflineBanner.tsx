"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getCacheAge } from "@/lib/offlineCache";
import { useEffect, useState } from "react";

/**
 * Shows a non-dismissible banner at the top of the viewport when offline.
 * Includes the age of the cached data so users know how stale it is.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [cacheAge, setCacheAge] = useState<string | null>(null);

  useEffect(() => {
    if (!isOnline) {
      const interval = setInterval(() => setCacheAge(getCacheAge()), 5000);
      return () => {
        clearInterval(interval);
        setCacheAge(null);
      };
    }
  }, [isOnline]);

  if (isOnline) return null;

  // Derive initial cache age during render; polled updates come from the interval.
  const displayAge = cacheAge ?? getCacheAge();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-warning px-4 py-1.5 text-center shadow-md">
      <svg
        className="h-3.5 w-3.5 text-black/70 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 1l22 22" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <span className="text-xs font-medium text-black">
        You&apos;re offline
        {displayAge ? ` — showing data from ${displayAge}` : " — displaying last cached data"}
      </span>
    </div>
  );
}
