/**
 * Typed Socket.io event maps — shared between server.ts and the client hooks
 * to guarantee compile-time safety across the WebSocket boundary.
 */

import type { RawTick, MarketSnapshot, SymbolConfig } from "./market";

export interface ServerToClientEvents {
  tick: (tick: RawTick) => void;
  snapshot: (data: MarketSnapshot) => void;
  symbols: (symbols: SymbolConfig[]) => void;
}

export interface ClientToServerEvents {
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
}
