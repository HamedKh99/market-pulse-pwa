import type { StateCreator } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hydrate: () => void;
}

// Mock user database
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "admin@marketpulse.io": {
    password: "admin123",
    user: {
      id: "usr_001",
      email: "admin@marketpulse.io",
      name: "Alex Trader",
      avatar: "AT",
    },
  },
  "demo@marketpulse.io": {
    password: "demo123",
    user: {
      id: "usr_002",
      email: "demo@marketpulse.io",
      name: "Demo User",
      avatar: "DU",
    },
  },
};

const AUTH_STORAGE_KEY = "mp-auth";

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 800));

    const entry = MOCK_USERS[email.toLowerCase()];
    if (entry && entry.password === password) {
      set({ user: entry.user, isAuthenticated: true });
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(entry.user));
      }
      return true;
    }
    return false;
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  hydrate: () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const user = JSON.parse(stored) as User;
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    set({ isLoading: false });
  },
});
