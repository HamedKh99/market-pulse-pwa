"use client";

import { useStore } from "@/store";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/formatters";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useEffect, useState } from "react";

export function StatusBar() {
  const connectionStatus = useStore((s) => s.connectionStatus);
  const lastUpdateTimestamp = useStore((s) => s.lastUpdateTimestamp);
  const priceCount = useStore((s) => Object.keys(s.prices).length);
  const isOnline = useOnlineStatus();
  const [, setTick] = useState(0);

  // 1 Hz tick so the "Xs ago" label stays current without WebSocket dependency.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="flex h-7 items-center justify-between border-t border-border bg-status-bar px-3 sm:px-4 transition-theme">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              !isOnline
                ? "bg-danger"
                : connectionStatus === "connected"
                  ? "bg-success"
                  : connectionStatus === "connecting"
                    ? "bg-warning"
                    : "bg-danger"
            )}
          />
          <span className="text-xs text-muted-foreground">
            {!isOnline ? "Offline" : connectionStatus}
          </span>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline">
          {priceCount} symbols active
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {lastUpdateTimestamp > 0 && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Last: {formatRelativeTime(lastUpdateTimestamp)}
          </span>
        )}
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {new Date().toLocaleTimeString("en-US", { hour12: false })}
        </span>
      </div>
    </footer>
  );
}
