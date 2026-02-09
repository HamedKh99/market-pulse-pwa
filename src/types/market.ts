export type Timeframe = "1m" | "5m" | "15m" | "1h" | "1D";

export const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "1D"];

export const TIMEFRAME_MS: Record<Timeframe, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "1D": 86_400_000,
};

/** Wire format: the minimal tick payload emitted by the Socket.io server. */
export interface RawTick {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: number;
}

/** Enriched tick produced by the Worker — includes derived fields (spread, Δ%, direction). */
export interface TickData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  volume24h: number;
  change1m: number;
  change1h: number;
  change24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
  direction: "up" | "down" | "neutral";
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolConfig {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number; // Annual volatility (0-1)
  icon: string;       // Emoji or icon identifier
  category: "crypto" | "forex" | "commodity";
}

export type SparklineData = number[];

/** Server-side snapshot sent on initial connection for instant first paint. */
export interface MarketSnapshot {
  [symbol: string]: {
    price: number;
    bid: number;
    ask: number;
    volume24h: number;
    high24h: number;
    low24h: number;
    change24h: number;
    timestamp: number;
  };
}
