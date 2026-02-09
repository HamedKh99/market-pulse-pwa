"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store";
import type { MainToWorkerMessage, WorkerToMainMessage } from "@/workers/protocol";
import type { RawTick, Timeframe } from "@/types/market";

/**
 * Manages the Web Worker lifecycle.
 * - Spawns the tickProcessor Worker on mount
 * - Provides a `sendTick` callback for the Socket hook to push ticks
 * - Listens for batched updates from the Worker and writes them to Zustand
 */
export function useTickWorker() {
  const workerRef = useRef<Worker | null>(null);
  const readyRef = useRef(false);
  const updatePrices = useStore((s) => s.updatePrices);
  const updateCandles = useStore((s) => s.updateCandles);
  const updateSparklines = useStore((s) => s.updateSparklines);

  useEffect(() => {
    // Spawn Web Worker using relative path (Turbopack resolves this)
    const worker = new Worker(
      new URL("../workers/tickProcessor.worker.ts", import.meta.url)
    );

    workerRef.current = worker;

    // Listen for batched updates from the Worker
    worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case "BATCH_UPDATE":
          updatePrices(msg.payload.ticks);
          updateCandles(msg.payload.candles);
          updateSparklines(msg.payload.sparklines);
          break;
        case "READY":
          readyRef.current = true;
          console.log("[Worker] tickProcessor ready");
          break;
        case "ERROR":
          console.error("[Worker] Error:", msg.payload);
          break;
      }
    };

    worker.onerror = (err) => {
      console.error("[Worker] Unhandled error:", err);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      readyRef.current = false;
    };
  }, [updatePrices, updateCandles, updateSparklines]);

  /** Send a single tick to the Worker. */
  const sendTick = useCallback((tick: RawTick) => {
    const msg: MainToWorkerMessage = { type: "TICK", payload: tick };
    workerRef.current?.postMessage(msg);
  }, []);

  /** Send a batch of ticks to the Worker. */
  const sendBatchTicks = useCallback((ticks: RawTick[]) => {
    const msg: MainToWorkerMessage = { type: "BATCH_TICKS", payload: ticks };
    workerRef.current?.postMessage(msg);
  }, []);

  /** Change the active timeframe in the Worker. */
  const setWorkerTimeframe = useCallback((tf: Timeframe) => {
    const msg: MainToWorkerMessage = { type: "SET_TIMEFRAME", payload: tf };
    workerRef.current?.postMessage(msg);
  }, []);

  /** Initialize Worker with snapshot data. */
  const initSnapshot = useCallback(
    (data: Record<string, { price: number; volume24h: number; change24h: number; high24h: number; low24h: number }>) => {
      const msg: MainToWorkerMessage = { type: "INIT_SNAPSHOT", payload: data };
      workerRef.current?.postMessage(msg);
    },
    []
  );

  return { sendTick, sendBatchTicks, setWorkerTimeframe, initSnapshot, isReady: readyRef };
}
