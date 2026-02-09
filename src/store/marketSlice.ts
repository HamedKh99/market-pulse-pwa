import type { StateCreator } from "zustand";
import type { Candle, SparklineData, SymbolConfig } from "@/types/market";

export interface MarketSlice {
  /** OHLC candle data per symbol (for the active timeframe). */
  candles: Record<string, Candle[]>;

  /** Sparkline arrays per symbol (last 60 data points). */
  sparklines: Record<string, SparklineData>;

  /** Available symbol configs (received from server). */
  symbols: SymbolConfig[];

  /** Batch-update candles from Worker output. */
  updateCandles: (candles: Record<string, Candle[]>) => void;

  /** Batch-update sparklines from Worker output. */
  updateSparklines: (sparklines: Record<string, SparklineData>) => void;

  /** Set available symbols. */
  setSymbols: (symbols: SymbolConfig[]) => void;

  /** Clear all market data. */
  clearMarketData: () => void;
}

export const createMarketSlice: StateCreator<MarketSlice, [], [], MarketSlice> = (set) => ({
  candles: {},
  sparklines: {},
  symbols: [],

  updateCandles: (candles) =>
    set((state) => ({
      candles: { ...state.candles, ...candles },
    })),

  updateSparklines: (sparklines) =>
    set((state) => ({
      sparklines: { ...state.sparklines, ...sparklines },
    })),

  setSymbols: (symbols) => set({ symbols }),

  clearMarketData: () => set({ candles: {}, sparklines: {} }),
});
