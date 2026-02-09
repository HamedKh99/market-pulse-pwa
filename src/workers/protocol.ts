/**
 * Discriminated-union message protocol for the Main ↔ Worker boundary.
 *
 * Using tagged unions guarantees exhaustive type-checking in the Worker's
 * `switch` and avoids stringly-typed event buses.
 */

import type { RawTick, Timeframe, TickData, Candle, SparklineData } from "@/types/market";

/** Main thread → Worker */
export type MainToWorkerMessage =
  | { type: "TICK"; payload: RawTick }
  | { type: "BATCH_TICKS"; payload: RawTick[] }
  | { type: "SET_TIMEFRAME"; payload: Timeframe }
  | { type: "SUBSCRIBE"; payload: string[] }
  | { type: "UNSUBSCRIBE"; payload: string[] }
  | { type: "INIT_SNAPSHOT"; payload: Record<string, { price: number; volume24h: number; change24h: number; high24h: number; low24h: number }> };

/** Worker → Main thread */
export type WorkerToMainMessage =
  | {
      type: "BATCH_UPDATE";
      payload: {
        ticks: Record<string, TickData>;
        candles: Record<string, Candle[]>;
        sparklines: Record<string, SparklineData>;
      };
    }
  | { type: "READY" }
  | { type: "ERROR"; payload: string };
