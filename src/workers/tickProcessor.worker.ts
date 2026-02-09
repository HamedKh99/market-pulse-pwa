/**
 * tickProcessor.worker.ts
 *
 * The core Web Worker that absorbs the high-frequency tick firehose,
 * performs all heavy computation off the main thread, and emits
 * throttled batched updates at ~60fps.
 *
 * Architecture:
 * 1. Receives raw ticks via postMessage from main thread
 * 2. Buffers ticks into per-symbol ring buffers
 * 3. Aggregates OHLC candles for the active timeframe
 * 4. Computes derived metrics (Δ%, spread, sparkline)
 * 5. Every ~16ms, emits only changed data back to main thread
 */

import type { RawTick, TickData, Candle, Timeframe } from "@/types/market";
import { TIMEFRAME_MS } from "@/types/market";
import type { MainToWorkerMessage, WorkerToMainMessage } from "./protocol";

// ─── Internal State ──────────────────────────────────────────────────────────
const SPARKLINE_SIZE = 60;
const MAX_CANDLES = 200;

interface SymbolState {
  // Latest tick data
  price: number;
  prevPrice: number;
  bid: number;
  ask: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change24h: number;
  timestamp: number;

  // Price tracking for Δ% calculations
  priceHistory1m: number[];  // Prices in last 1 minute
  priceHistory1h: number[];  // Prices in last 1 hour

  // Sparkline ring buffer
  sparkline: number[];
  sparklineIndex: number;

  // OHLC candle accumulation
  currentCandle: Candle | null;
  candles: Candle[];

  // Dirty flag — only serialize changed symbols
  dirty: boolean;
}

let symbolStates = new Map<string, SymbolState>();
let subscribedSymbols = new Set<string>();
let activeTimeframe: Timeframe = "1m";
let lastEmitTime = 0;
const THROTTLE_MS = 16; // ~60fps

// ─── Helper: Initialize symbol state ─────────────────────────────────────────
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

// ─── Process a single tick ───────────────────────────────────────────────────
function processTick(tick: RawTick): void {
  const state = getOrCreateState(tick.symbol);
  const now = tick.timestamp;

  // Track previous price for direction
  state.prevPrice = state.price || tick.price;
  state.price = tick.price;
  state.bid = tick.bid;
  state.ask = tick.ask;
  state.volume24h += tick.volume;
  state.high24h = Math.max(state.high24h || tick.price, tick.price);
  state.low24h = state.low24h === 0 ? tick.price : Math.min(state.low24h, tick.price);
  state.timestamp = now;

  // Price history for Δ% (keep bounded)
  state.priceHistory1m.push(tick.price);
  state.priceHistory1h.push(tick.price);

  // Prune old entries (1m = last 600 ticks at 100ms, 1h = last 36000)
  if (state.priceHistory1m.length > 600) state.priceHistory1m.shift();
  if (state.priceHistory1h.length > 36000) state.priceHistory1h.shift();

  // Sparkline ring buffer — push close price every ~1 second (every 10 ticks)
  if (state.priceHistory1m.length % 10 === 0) {
    state.sparkline[state.sparklineIndex] = tick.price;
    state.sparklineIndex = (state.sparklineIndex + 1) % SPARKLINE_SIZE;
  }

  // Candle aggregation
  updateCandle(state, tick);

  state.dirty = true;
}

// ─── Update OHLC candle ─────────────────────────────────────────────────────
function updateCandle(state: SymbolState, tick: RawTick): void {
  const intervalMs = TIMEFRAME_MS[activeTimeframe];
  const candleTime = Math.floor(tick.timestamp / intervalMs) * intervalMs;

  if (!state.currentCandle || state.currentCandle.time !== candleTime) {
    // Close previous candle and start new one
    if (state.currentCandle) {
      state.candles.push({ ...state.currentCandle });
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
    // Update current candle
    state.currentCandle.high = Math.max(state.currentCandle.high, tick.price);
    state.currentCandle.low = Math.min(state.currentCandle.low, tick.price);
    state.currentCandle.close = tick.price;
    state.currentCandle.volume += tick.volume;
  }
}

// ─── Build sparkline array (unroll ring buffer) ──────────────────────────────
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

// ─── Build TickData from state ───────────────────────────────────────────────
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

// ─── Emit throttled batch update ─────────────────────────────────────────────
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

    // Include current candle in the candles array
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

// ─── Message handler ─────────────────────────────────────────────────────────
self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case "TICK":
      processTick(msg.payload);
      break;

    case "BATCH_TICKS":
      for (const tick of msg.payload) {
        processTick(tick);
      }
      break;

    case "SET_TIMEFRAME":
      activeTimeframe = msg.payload;
      // Reset candles on timeframe change
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

// ─── Throttled output loop (60fps) ───────────────────────────────────────────
setInterval(emitBatchUpdate, THROTTLE_MS);

// ─── Signal ready ────────────────────────────────────────────────────────────
const readyMsg: WorkerToMainMessage = { type: "READY" };
self.postMessage(readyMsg);
