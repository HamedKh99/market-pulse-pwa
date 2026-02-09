import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { createUISlice, type UISlice } from "./uiSlice";
import { createAuthSlice, type AuthSlice } from "./authSlice";
import { createTickSlice, type TickSlice } from "./tickSlice";
import { createMarketSlice, type MarketSlice } from "./marketSlice";

export type AppStore = UISlice & AuthSlice & TickSlice & MarketSlice;

/**
 * Composed Zustand store — slices are merged at creation time so every
 * selector has access to the full state shape while each slice file
 * remains independently testable.
 */
export const useStore = create<AppStore>()((...args) => ({
  ...createUISlice(...args),
  ...createAuthSlice(...args),
  ...createTickSlice(...args),
  ...createMarketSlice(...args),
}));

/** Stable empty reference — prevents selector consumers from re-rendering
 *  when a symbol has no data yet (new array ref on every call would fail
 *  React's `Object.is` check). */
const EMPTY_ARRAY: readonly never[] = [];

// Granular selector hooks — each subscribes to a minimal state slice
// so components only re-render when their specific data changes.

export const useTheme = () => useStore((s) => s.theme);
export const useAuth = () =>
  useStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
      isLoading: s.isLoading,
      login: s.login,
      logout: s.logout,
      hydrate: s.hydrate,
    }))
  );
export const useConnectionStatus = () => useStore((s) => s.connectionStatus);
export const useSelectedSymbol = () => useStore((s) => s.selectedSymbol);
export const useTimeframe = () => useStore((s) => s.timeframe);
export const usePrice = (symbol: string) => useStore((s) => s.prices[symbol]);
export const useCandles = (symbol: string) => useStore((s) => s.candles[symbol] ?? EMPTY_ARRAY);
export const useSparkline = (symbol: string) => useStore((s) => s.sparklines[symbol] ?? EMPTY_ARRAY);
export const useSymbols = () => useStore((s) => s.symbols);
