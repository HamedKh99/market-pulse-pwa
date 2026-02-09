import type { StateCreator } from "zustand";
import type { TickData } from "@/types/market";

export interface TickSlice {
  /** Live price data for all symbols. Updated at 60fps from Worker. */
  prices: Record<string, TickData>;

  /** Batch-update prices from Worker output. */
  updatePrices: (ticks: Record<string, TickData>) => void;

  /** Clear all price data (e.g., on disconnect). */
  clearPrices: () => void;
}

export const createTickSlice: StateCreator<TickSlice, [], [], TickSlice> = (set) => ({
  prices: {},

  updatePrices: (ticks) =>
    set((state) => ({
      prices: { ...state.prices, ...ticks },
    })),

  clearPrices: () => set({ prices: {} }),
});
