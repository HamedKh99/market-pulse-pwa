"use client";

import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store";
import type { MainToWorkerMessage, WorkerToMainMessage } from "@/workers/protocol";
import type { RawTick, Timeframe } from "@/types/market";

/**
 * Bridge between the React lifecycle and the `tickProcessor` Web Worker.
 *
 * Spawns the Worker on mount and tears it down on unmount. Exposes
 * fire-and-forget `sendTick` / `sendBatchTicks` callbacks that the
 * DataProvider calls on every socket event — no main-thread parsing.
 *
 * Inbound `BATCH_UPDATE` messages (throttled to ~60 FPS inside the Worker)
 * are funnelled straight into Zustand, giving React a single re-render
 * trigger per animation frame.
 *
 * @returns Stable callbacks for pushing data into the Worker, plus a
 *          `isReady` ref consumers can check before sending messages.
 */
export function useTickWorker() {
  const workerRef = useRef<Worker | null>(null);
  const readyRef = useRef(false);
  const updatePrices = useStore((s) => s.updatePrices);
  const updateCandles = useStore((s) => s.updateCandles);
  const updateSparklines = useStore((s) => s.updateSparklines);

  useEffect(() => {
    // `new URL(…, import.meta.url)` lets Turbopack / Webpack resolve
    // the Worker entry point at build time with full TS support.
    const worker = new Worker(
      new URL("../workers/tickProcessor.worker.ts", import.meta.url)
    );

    workerRef.current = worker;

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

  /** Forward a single raw tick to the Worker for off-thread processing. */
  const sendTick = useCallback((tick: RawTick) => {
    const msg: MainToWorkerMessage = { type: "TICK", payload: tick };
    workerRef.current?.postMessage(msg);
  }, []);

  /** Forward a pre-batched array when the server sends burst payloads. */
  const sendBatchTicks = useCallback((ticks: RawTick[]) => {
    const msg: MainToWorkerMessage = { type: "BATCH_TICKS", payload: ticks };
    workerRef.current?.postMessage(msg);
  }, []);

  /** Notify the Worker of a timeframe change so it can reset candle state. */
  const setWorkerTimeframe = useCallback((tf: Timeframe) => {
    const msg: MainToWorkerMessage = { type: "SET_TIMEFRAME", payload: tf };
    workerRef.current?.postMessage(msg);
  }, []);

  /** Seed the Worker with the initial server snapshot for instant first paint. */
  const initSnapshot = useCallback(
    (data: Record<string, { price: number; volume24h: number; change24h: number; high24h: number; low24h: number }>) => {
      const msg: MainToWorkerMessage = { type: "INIT_SNAPSHOT", payload: data };
      workerRef.current?.postMessage(msg);
    },
    []
  );

  return { sendTick, sendBatchTicks, setWorkerTimeframe, initSnapshot, isReady: readyRef };
}
