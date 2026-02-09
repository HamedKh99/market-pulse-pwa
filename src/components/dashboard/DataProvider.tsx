"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useStore } from "@/store";
import { useTickWorker } from "@/hooks/useTickWorker";
import { saveOfflineSnapshot, loadOfflineSnapshot } from "@/lib/offlineCache";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/socket";
import type { RawTick, MarketSnapshot, SymbolConfig } from "@/types/market";

type MarketSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * DataProvider — Central orchestrator wiring the real-time data pipeline:
 *
 *   Socket.io  →  Web Worker (off-thread parsing)  →  Zustand (single store)
 *
 * ### Offline resilience
 * - Snapshots the full price map to `localStorage` every 5 s (debounced,
 *   NOT per-tick — avoids storage I/O thrashing).
 * - On boot, if the browser is offline, hydrates the store from the most
 *   recent snapshot so the UI renders immediately with stale-but-useful data.
 *
 * This component deliberately renders no DOM of its own — it is a pure
 * side-effect boundary, keeping data concerns out of presentational trees.
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<MarketSocket | null>(null);
  const { sendTick, initSnapshot, setWorkerTimeframe } = useTickWorker();
  const isOnline = useOnlineStatus();

  const setConnectionStatus = useStore((s) => s.setConnectionStatus);
  const setLastUpdateTimestamp = useStore((s) => s.setLastUpdateTimestamp);
  const setSymbols = useStore((s) => s.setSymbols);
  const timeframe = useStore((s) => s.timeframe);

  // Propagate timeframe to the Worker so it re-buckets candles.
  useEffect(() => {
    setWorkerTimeframe(timeframe);
  }, [timeframe, setWorkerTimeframe]);

  // Hydrate from localStorage when the app boots without connectivity.
  useEffect(() => {
    if (!isOnline) {
      const cached = loadOfflineSnapshot();
      if (cached) {
        console.log("[DataProvider] Loaded offline cache from", new Date(cached.timestamp).toLocaleTimeString());
        useStore.getState().updatePrices(cached.prices);
        useStore.getState().updateSparklines(cached.sparklines);
        if (cached.symbols.length > 0) {
          useStore.getState().setSymbols(cached.symbols);
        }
        setLastUpdateTimestamp(cached.timestamp);
      }
    }
  }, [isOnline, setLastUpdateTimestamp]);

  // Periodic localStorage snapshot — 5 s interval balances freshness
  // vs. I/O cost (writing 50-symbol JSON is ~15 KB).
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useStore.getState();
      const priceCount = Object.keys(state.prices).length;
      if (priceCount > 0) {
        saveOfflineSnapshot({
          prices: state.prices,
          sparklines: state.sparklines,
          symbols: state.symbols,
        });
      }
    }, 5_000);

    return () => clearInterval(interval);
  }, []);

  // Socket.io lifecycle — auto-reconnect with exponential back-off.
  useEffect(() => {
    if (!isOnline) {
      setConnectionStatus("disconnected");
      return;
    }

    const socket: MarketSocket = io("/market", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnectionStatus("connected");
      console.log("[DataProvider] Connected to /market");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      console.log("[DataProvider] Disconnected");
    });

    socket.io.on("reconnect_attempt", () => {
      setConnectionStatus("connecting");
    });

    socket.on("snapshot", (snapshot: MarketSnapshot) => {
      console.log(`[DataProvider] Snapshot: ${Object.keys(snapshot).length} symbols`);
      initSnapshot(snapshot);
    });

    socket.on("symbols", (symbols: SymbolConfig[]) => {
      console.log(`[DataProvider] Symbols: ${symbols.length}`);
      setSymbols(symbols);
    });

    socket.on("tick", (tick: RawTick) => {
      setLastUpdateTimestamp(tick.timestamp);
      sendTick(tick);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOnline, sendTick, initSnapshot, setConnectionStatus, setLastUpdateTimestamp, setSymbols]);

  return <>{children}</>;
}
