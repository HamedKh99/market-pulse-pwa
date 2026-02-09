/**
 * tickProcessor.worker.ts
 *
 * Off-main-thread data pipeline that keeps the UI at 60 FPS even under
 * a firehose of WebSocket ticks (10+ messages/sec × 50 symbols).
 *
 * ### Data flow
 *  1. Main thread forwards raw ticks via `postMessage` — zero parsing on UI thread.
 *  2. Worker buffers ticks into per-symbol state, aggregates OHLC candles for
 *     the active timeframe, and maintains ring-buffer sparklines.
 *  3. A 16 ms `setInterval` drains only *dirty* symbols into a single
 *     `BATCH_UPDATE` message — coalescing N ticks into 1 render frame.
 *
 * ### Why a dedicated Worker?
 * JSON.parse of each tick + candle aggregation + sparkline rotation would
 * block the main thread for 2-4 ms per burst. At 10 tps × 50 symbols that
 * leaves < 8 ms for React reconciliation — not enough for 60 FPS.
 * Moving everything here guarantees the UI thread only pays the cost of a
 * single structured-clone per frame.
 */

import type { RawTick, TickData, Candle, Timeframe } from "@/types/market";
import { TIMEFRAME_MS } from "@/types/market";
import type { MainToWorkerMessage, WorkerToMainMessage } from "./protocol";

const SPARKLINE_SIZE = 60;
const MAX_CANDLES = 200;

interface SymbolState {
  price: number;
  prevPrice: number;
  bid: number;
  ask: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
  timestamp: number;

  /** Bounded sliding windows for Δ% — pruned to avoid unbounded growth. */
  priceHistory1m: number[];
  priceHistory1h: number[];

  /** Fixed-size ring buffer; avoids array re-allocation on every sparkline push. */
  sparkline: number[];
  sparklineIndex: number;

  currentCandle: Candle | null;
  candles: Candle[];

  /** Dirty flag — only changed symbols are serialized in the next batch emit. */
  dirty: boolean;
}

let symbolStates = new Map<string, SymbolState>();
let subscribedSymbols = new Set<string>();
let activeTimeframe: Timeframe = "1m";
let lastEmitTime = 0;

/** Emit ceiling aligned to ~60 FPS (1 frame = 16.67 ms). */
const THROTTLE_MS = 16;

function getOrCreateState(symbol: string): SymbolState {
  let state = symbolStates.get(symbol);
  if (!state) {
    state = {
      price: 0,
      prevPrice: 0,
      bid: 0,
      ask: 0,
      volume24h: 0,
      high24h: 0,
      low24h: 0,
      change24h: 0,
      timestamp: 0,
      priceHistory1m: [],
      priceHistory1h: [],
      sparkline: new Array(SPARKLINE_SIZE).fill(0),
      sparklineIndex: 0,
      currentCandle: null,
      candles: [],
      dirty: false,
    };
    symbolStates.set(symbol, state);
  }
  return state;
}

function processTick(tick: RawTick): void {
  const state = getOrCreateState(tick.symbol);

  state.prevPrice = state.price || tick.price;
  state.price = tick.price;
  state.bid = tick.bid;
  state.ask = tick.ask;
  state.volume24h += tick.volume;
  state.high24h = Math.max(state.high24h || tick.price, tick.price);
  state.low24h = state.low24h === 0 ? tick.price : Math.min(state.low24h, tick.price);
  state.timestamp = tick.timestamp;

  // Sliding windows: bounded to avoid unbounded memory growth.
  // 600 entries ≈ 1 min at 100 ms tick interval; 36 000 ≈ 1 h.
  state.priceHistory1m.push(tick.price);
  state.priceHistory1h.push(tick.price);
  if (state.priceHistory1m.length > 600) state.priceHistory1m.shift();
  if (state.priceHistory1h.length > 36000) state.priceHistory1h.shift();

  // Down-sample into the sparkline ring buffer (~1 point/sec) to keep the
  // mini-chart stable without flooding the main thread with 60-point arrays.
  if (state.priceHistory1m.length % 10 === 0) {
    state.sparkline[state.sparklineIndex] = tick.price;
    state.sparklineIndex = (state.sparklineIndex + 1) % SPARKLINE_SIZE;
  }

  updateCandle(state, tick);
  state.dirty = true;
}

/** Aggregate ticks into OHLC candles bucketed by the active timeframe. */
function updateCandle(state: SymbolState, tick: RawTick): void {
  const intervalMs = TIMEFRAME_MS[activeTimeframe];
  // Floor to the nearest candle boundary so all ticks within the same
  // interval collapse into one candle — standard OHLC bucketing.
  const candleTime = Math.floor(tick.timestamp / intervalMs) * intervalMs;

  if (!state.currentCandle || state.currentCandle.time !== candleTime) {
    if (state.currentCandle) {
      state.candles.push({ ...state.currentCandle });
      // Cap history to MAX_CANDLES to bound memory.
      if (state.candles.length > MAX_CANDLES) state.candles.shift();
    }
    state.currentCandle = {
      time: candleTime,
      open: tick.price,
      high: tick.price,
      low: tick.price,
      close: tick.price,
      volume: tick.volume,
    };
  } else {
    state.currentCandle.high = Math.max(state.currentCandle.high, tick.price);
    state.currentCandle.low = Math.min(state.currentCandle.low, tick.price);
    state.currentCandle.close = tick.price;
    state.currentCandle.volume += tick.volume;
  }
}

/** Unroll the ring buffer into a chronologically ordered array. */
function getSparklineArray(state: SymbolState): number[] {
  const result: number[] = [];
  for (let i = 0; i < SPARKLINE_SIZE; i++) {
    const idx = (state.sparklineIndex + i) % SPARKLINE_SIZE;
    if (state.sparkline[idx] !== 0) {
      result.push(state.sparkline[idx]);
    }
  }
  return result;
}

/** Project internal state into the TickData shape consumed by the UI. */
function buildTickData(symbol: string, state: SymbolState): TickData {
  const price1mAgo = state.priceHistory1m.length > 0 ? state.priceHistory1m[0] : state.price;
  const price1hAgo = state.priceHistory1h.length > 0 ? state.priceHistory1h[0] : state.price;

  return {
    symbol,
    price: state.price,
    bid: state.bid,
    ask: state.ask,
    spread: state.ask - state.bid,
    volume24h: state.volume24h,
    change1m: price1mAgo ? ((state.price - price1mAgo) / price1mAgo) * 100 : 0,
    change1h: price1hAgo ? ((state.price - price1hAgo) / price1hAgo) * 100 : 0,
    change24h: state.change24h,
    high24h: state.high24h,
    low24h: state.low24h,
    timestamp: state.timestamp,
    direction: state.price > state.prevPrice ? "up" : state.price < state.prevPrice ? "down" : "neutral",
  };
}

/**
 * Coalesce all dirty symbol state into a single `BATCH_UPDATE` postMessage.
 * Throttled to THROTTLE_MS so the main thread never receives more than
 * ~60 messages/sec regardless of tick volume.
 */
function emitBatchUpdate(): void {
  const now = performance.now();
  if (now - lastEmitTime < THROTTLE_MS) return;
  lastEmitTime = now;

  const ticks: Record<string, TickData> = {};
  const candles: Record<string, Candle[]> = {};
  const sparklines: Record<string, number[]> = {};
  let hasDirty = false;

  for (const [symbol, state] of symbolStates) {
    if (!state.dirty) continue;
    hasDirty = true;

    ticks[symbol] = buildTickData(symbol, state);

    const allCandles = [...state.candles];
    if (state.currentCandle) allCandles.push(state.currentCandle);
    candles[symbol] = allCandles;

    sparklines[symbol] = getSparklineArray(state);
    state.dirty = false;
  }

  if (!hasDirty) return;

  const message: WorkerToMainMessage = {
    type: "BATCH_UPDATE",
    payload: { ticks, candles, sparklines },
  };

  self.postMessage(message);
}

// Inbound message dispatcher — see protocol.ts for the discriminated union.
self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case "TICK":
      processTick(msg.payload);
      break;

    case "BATCH_TICKS":
      for (const tick of msg.payload) processTick(tick);
      break;

    case "SET_TIMEFRAME":
      activeTimeframe = msg.payload;
      // Candle history is per-timeframe; invalidate on switch.
      for (const state of symbolStates.values()) {
        state.candles = [];
        state.currentCandle = null;
        state.dirty = true;
      }
      break;

    case "SUBSCRIBE":
      msg.payload.forEach((s) => subscribedSymbols.add(s));
      break;

    case "UNSUBSCRIBE":
      msg.payload.forEach((s) => subscribedSymbols.delete(s));
      break;

    case "INIT_SNAPSHOT":
      // Hydrate state from the server-side snapshot so the UI has prices
      // on the very first render frame, before any live ticks arrive.
      for (const [symbol, data] of Object.entries(msg.payload)) {
        const state = getOrCreateState(symbol);
        state.price = data.price;
        state.prevPrice = data.price;
        state.volume24h = data.volume24h;
        state.high24h = data.high24h;
        state.low24h = data.low24h;
        state.change24h = data.change24h;
        state.sparkline.fill(data.price);
        state.dirty = true;
      }
      break;
  }
};

// Continuous drain loop — coalesces ticks between frames into one postMessage.
setInterval(emitBatchUpdate, THROTTLE_MS);

const readyMsg: WorkerToMainMessage = { type: "READY" };
self.postMessage(readyMsg);
