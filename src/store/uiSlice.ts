import type { StateCreator } from "zustand";
import type { Timeframe } from "@/types/market";

export type Theme = "light" | "dark";
export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface UISlice {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Selected symbol (for main chart)
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;

  // Active timeframe
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;

  // Connection
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  lastUpdateTimestamp: number;
  setLastUpdateTimestamp: (ts: number) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Category filter
  activeCategory: "all" | "crypto" | "forex" | "commodity";
  setActiveCategory: (cat: "all" | "crypto" | "forex" | "commodity") => void;
}

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  // Theme — default to dark, will be hydrated from localStorage
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

  // Default to BTC
  selectedSymbol: "BTC/USD",
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  // Default timeframe
  timeframe: "1m",
  setTimeframe: (tf) => set({ timeframe: tf }),

  // Connection
  connectionStatus: "disconnected",
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  lastUpdateTimestamp: 0,
  setLastUpdateTimestamp: (ts) => set({ lastUpdateTimestamp: ts }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Category
  activeCategory: "all",
  setActiveCategory: (cat) => set({ activeCategory: cat }),
});
