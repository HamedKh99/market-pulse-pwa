"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useStore } from "@/store";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types/socket";

type MarketSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Manages the Socket.io connection lifecycle.
 * Connects to the /market namespace on mount, disconnects on unmount.
 * Passes incoming ticks to the Web Worker via the provided callback.
 */
export function useSocket(onTick?: (tick: import("@/types/market").RawTick) => void) {
  const socketRef = useRef<MarketSocket | null>(null);
  const setConnectionStatus = useStore((s) => s.setConnectionStatus);
  const setLastUpdateTimestamp = useStore((s) => s.setLastUpdateTimestamp);
  const setSymbols = useStore((s) => s.setSymbols);

  useEffect(() => {
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

    // Handle initial snapshot
    socket.on("snapshot", (snapshot) => {
      console.log(`[Socket] Received snapshot: ${Object.keys(snapshot).length} symbols`);
      // The snapshot will be forwarded to the Worker via useTickWorker
    });

    // Handle symbols list
    socket.on("symbols", (symbols) => {
      setSymbols(symbols);
    });

    // Handle incoming ticks
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
