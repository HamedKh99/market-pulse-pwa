import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { createUISlice, type UISlice } from "./uiSlice";
import { createAuthSlice, type AuthSlice } from "./authSlice";
import { createTickSlice, type TickSlice } from "./tickSlice";
import { createMarketSlice, type MarketSlice } from "./marketSlice";

// ─── Combined Store Type ─────────────────────────────────────────────────────
export type AppStore = UISlice & AuthSlice & TickSlice & MarketSlice;

// ─── Create Combined Store ───────────────────────────────────────────────────
export const useStore = create<AppStore>()((...args) => ({
  ...createUISlice(...args),
  ...createAuthSlice(...args),
  ...createTickSlice(...args),
  ...createMarketSlice(...args),
}));

// ─── Stable fallback constants (avoid new references in selectors) ───────────
const EMPTY_ARRAY: readonly never[] = [];

// ─── Typed Selector Hooks (prevent unnecessary re-renders) ───────────────────
// Usage: const price = usePrice('BTC/USD')  → only re-renders when BTC price changes

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
