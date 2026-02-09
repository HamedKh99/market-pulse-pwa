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
 * DataProvider — The central orchestrator that wires:
 *   Socket.io (real-time ticks) → Web Worker (processing) → Zustand (state)
 *
 * Also handles:
 *   - Offline cache: periodically snapshots prices to localStorage
 *   - Offline restore: loads cached data when offline on boot
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<MarketSocket | null>(null);
  const { sendTick, initSnapshot, setWorkerTimeframe } = useTickWorker();
  const isOnline = useOnlineStatus();

  const setConnectionStatus = useStore((s) => s.setConnectionStatus);
  const setLastUpdateTimestamp = useStore((s) => s.setLastUpdateTimestamp);
  const setSymbols = useStore((s) => s.setSymbols);
  const timeframe = useStore((s) => s.timeframe);

  // ── Sync timeframe changes to the Worker ──────────────────────
  useEffect(() => {
    setWorkerTimeframe(timeframe);
  }, [timeframe, setWorkerTimeframe]);

  // ── Load offline cache on boot if offline ─────────────────────
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

  // ── Periodic offline snapshot (every 5 seconds) ───────────────
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

  // ── Socket.io connection lifecycle ────────────────────────────
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
