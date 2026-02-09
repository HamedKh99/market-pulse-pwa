import { SYMBOLS } from "./symbols";
import type { RawTick, MarketSnapshot, SymbolConfig } from "@/types/market";

/**
 * Geometric Brownian Motion (GBM) price simulator.
 *
 * Generates statistically realistic price walks using the stochastic
 * differential equation  `dS = μ·S·dt + σ·S·dW` — the same model
 * underlying Black-Scholes. Per-symbol volatility σ is calibrated to
 * approximate real-world annual vol for each asset class.
 */

interface SymbolState {
  config: SymbolConfig;
  price: number;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  openPrice: number;
  lastTimestamp: number;
}

/** Box-Muller transform — produces N(0,1) samples from uniform randoms. */
function randomNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function createPriceEngine() {
  const states = new Map<string, SymbolState>();
  const dt = 0.1 / (365 * 24 * 3600); // 100ms in years (for annualized vol)

  for (const config of SYMBOLS) {
    const spreadPct = config.category === "crypto" ? 0.001 : 0.0002;
    const halfSpread = config.basePrice * spreadPct;

    states.set(config.symbol, {
      config,
      price: config.basePrice,
      bid: config.basePrice - halfSpread,
      ask: config.basePrice + halfSpread,
      high24h: config.basePrice * 1.02,
      low24h: config.basePrice * 0.98,
      volume24h: config.basePrice * 1_000_000 * (0.5 + Math.random()),
      openPrice: config.basePrice,
      lastTimestamp: Date.now(),
    });
  }

  /**
   * Advance all prices by one tick.
   * Returns ticks for a random subset of symbols (simulates real market
   * where not all symbols tick simultaneously).
   */
  function tick(): RawTick[] {
    const now = Date.now();
    const ticks: RawTick[] = [];

    // ~30-60% of symbols move per tick — mimics real-world market
    // behaviour where not all instruments update simultaneously.
    const tickRatio = 0.3 + Math.random() * 0.3;

    for (const [symbol, state] of states) {
      if (Math.random() > tickRatio) continue;

      const { config } = state;
      const drift = 0.0; // Neutral drift (no long-term bias)
      const vol = config.volatility;

      const dW = randomNormal();
      const dS = drift * state.price * dt + vol * state.price * Math.sqrt(dt) * dW;
      const newPrice = Math.max(state.price + dS, state.price * 0.001); // Floor at 0.1% of current

      // Spread widens proportionally to the tick's volatility shock.
      const spreadPct = config.category === "crypto" ? 0.001 : 0.0002;
      const volSpreadMultiplier = 1 + Math.abs(dW) * 0.1;
      const halfSpread = newPrice * spreadPct * volSpreadMultiplier;

      const tickVolume = state.volume24h * 0.00001 * (0.5 + Math.random() * 1.5);

      state.price = newPrice;
      state.bid = newPrice - halfSpread;
      state.ask = newPrice + halfSpread;
      state.high24h = Math.max(state.high24h, newPrice);
      state.low24h = Math.min(state.low24h, newPrice);
      state.volume24h += tickVolume;
      state.lastTimestamp = now;

      ticks.push({
        symbol,
        price: newPrice,
        bid: state.bid,
        ask: state.ask,
        volume: tickVolume,
        timestamp: now,
      });
    }

    return ticks;
  }

  /** Get current snapshot of all symbols (sent on initial connection). */
  function getSnapshot(): MarketSnapshot {
    const snapshot: MarketSnapshot = {};
    for (const [symbol, state] of states) {
      snapshot[symbol] = {
        price: state.price,
        bid: state.bid,
        ask: state.ask,
        volume24h: state.volume24h,
        high24h: state.high24h,
        low24h: state.low24h,
        change24h: ((state.price - state.openPrice) / state.openPrice) * 100,
        timestamp: state.lastTimestamp,
      };
    }
    return snapshot;
  }

  /** Get list of available symbols. */
  function getSymbols(): SymbolConfig[] {
    return SYMBOLS;
  }

  return { tick, getSnapshot, getSymbols };
}
