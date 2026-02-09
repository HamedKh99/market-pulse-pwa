import type { StateCreator } from "zustand";
import type { Timeframe } from "@/types/market";

export type Theme = "light" | "dark";
export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface UISlice {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;

  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;

  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  lastUpdateTimestamp: number;
  setLastUpdateTimestamp: (ts: number) => void;

  sidebarOpen: boolean;
  toggleSidebar: () => void;

  activeCategory: "all" | "crypto" | "forex" | "commodity";
  setActiveCategory: (cat: "all" | "crypto" | "forex" | "commodity") => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  theme: "dark",
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      localStorage.setItem("mp-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  },
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("mp-theme", next);
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return { theme: next };
    }),

  selectedSymbol: "BTC/USD",
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  timeframe: "1m",
  setTimeframe: (tf) => set({ timeframe: tf }),

  connectionStatus: "disconnected",
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  lastUpdateTimestamp: 0,
  setLastUpdateTimestamp: (ts) => set({ lastUpdateTimestamp: ts }),

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  activeCategory: "all",
  setActiveCategory: (cat) => set({ activeCategory: cat }),
});
