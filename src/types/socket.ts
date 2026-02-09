import type { RawTick, MarketSnapshot, SymbolConfig } from "./market";

// ─── Server → Client Events ─────────────────────────────────────────────────
export interface ServerToClientEvents {
  tick: (tick: RawTick) => void;
  snapshot: (data: MarketSnapshot) => void;
  symbols: (symbols: SymbolConfig[]) => void;
}

// ─── Client → Server Events ─────────────────────────────────────────────────
export interface ClientToServerEvents {
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
}
