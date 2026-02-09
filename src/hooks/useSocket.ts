"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useStore } from "@/store";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/socket";

type MarketSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Manages the Socket.io connection lifecycle for the `/market` namespace.
 *
 * Handles connect / disconnect / reconnect state transitions and
 * delegates incoming ticks to the caller via `onTick` (typically
 * piped straight into the Web Worker by the DataProvider).
 *
 * @param onTick - Optional callback invoked on every raw tick.
 *                 Kept as a parameter (rather than imported) to
 *                 decouple the transport layer from processing.
 * @returns `subscribe` / `unsubscribe` helpers for room-based filtering
 *          and a ref to the underlying socket instance.
 */
export function useSocket(onTick?: (tick: import("@/types/market").RawTick) => void) {
  const socketRef = useRef<MarketSocket | null>(null);
  const setConnectionStatus = useStore((s) => s.setConnectionStatus);
  const setLastUpdateTimestamp = useStore((s) => s.setLastUpdateTimestamp);
  const setSymbols = useStore((s) => s.setSymbols);

  useEffect(() => {
    // Prefer WebSocket for lower latency; fall back to long-polling
    // behind corporate proxies that strip Upgrade headers.
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
      console.log("[Socket] Connected to /market");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      console.log("[Socket] Disconnected");
    });

    socket.io.on("reconnect_attempt", () => {
      setConnectionStatus("connecting");
    });

    socket.on("snapshot", (snapshot) => {
      console.log(`[Socket] Received snapshot: ${Object.keys(snapshot).length} symbols`);
    });

    socket.on("symbols", (symbols) => {
      setSymbols(symbols);
    });

    socket.on("tick", (tick) => {
      setLastUpdateTimestamp(tick.timestamp);
      onTick?.(tick);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onTick, setConnectionStatus, setLastUpdateTimestamp, setSymbols]);

  const subscribe = useCallback((symbols: string[]) => {
    socketRef.current?.emit("subscribe", symbols);
  }, []);

  const unsubscribe = useCallback((symbols: string[]) => {
    socketRef.current?.emit("unsubscribe", symbols);
  }, []);

  return { subscribe, unsubscribe, socket: socketRef };
}
