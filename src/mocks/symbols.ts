import type { SymbolConfig } from "@/types/market";

/**
 * 50 mock symbols spanning crypto, forex, and commodities.
 * Each has a base price and annual volatility for the GBM simulator.
 */
export const SYMBOLS: SymbolConfig[] = [
  // ── Major Crypto ──────────────────────────────────────────────────────────
  { symbol: "BTC/USD",  name: "Bitcoin",        basePrice: 97_420.50, volatility: 0.65, icon: "₿", category: "crypto" },
  { symbol: "ETH/USD",  name: "Ethereum",       basePrice: 3_285.30,  volatility: 0.72, icon: "Ξ", category: "crypto" },
  { symbol: "SOL/USD",  name: "Solana",         basePrice: 198.45,    volatility: 0.85, icon: "◎", category: "crypto" },
  { symbol: "BNB/USD",  name: "BNB",            basePrice: 652.80,    volatility: 0.60, icon: "⬡", category: "crypto" },
  { symbol: "XRP/USD",  name: "Ripple",         basePrice: 2.48,      volatility: 0.78, icon: "✕", category: "crypto" },
  { symbol: "ADA/USD",  name: "Cardano",        basePrice: 0.98,      volatility: 0.80, icon: "₳", category: "crypto" },
  { symbol: "AVAX/USD", name: "Avalanche",      basePrice: 38.75,     volatility: 0.82, icon: "▲", category: "crypto" },
  { symbol: "DOT/USD",  name: "Polkadot",       basePrice: 7.35,      volatility: 0.75, icon: "●", category: "crypto" },
  { symbol: "LINK/USD", name: "Chainlink",      basePrice: 18.90,     volatility: 0.70, icon: "⬡", category: "crypto" },
  { symbol: "MATIC/USD",name: "Polygon",        basePrice: 0.52,      volatility: 0.85, icon: "⬟", category: "crypto" },
  { symbol: "UNI/USD",  name: "Uniswap",        basePrice: 12.35,     volatility: 0.78, icon: "🦄", category: "crypto" },
  { symbol: "ATOM/USD", name: "Cosmos",         basePrice: 9.20,      volatility: 0.72, icon: "⚛", category: "crypto" },
  { symbol: "FTM/USD",  name: "Fantom",         basePrice: 0.78,      volatility: 0.90, icon: "👻", category: "crypto" },
  { symbol: "NEAR/USD", name: "NEAR Protocol",  basePrice: 5.42,      volatility: 0.80, icon: "Ⓝ", category: "crypto" },
  { symbol: "APT/USD",  name: "Aptos",          basePrice: 9.85,      volatility: 0.82, icon: "◆", category: "crypto" },
  { symbol: "OP/USD",   name: "Optimism",       basePrice: 2.15,      volatility: 0.85, icon: "⭕", category: "crypto" },
  { symbol: "ARB/USD",  name: "Arbitrum",       basePrice: 1.08,      volatility: 0.83, icon: "🔵", category: "crypto" },
  { symbol: "SUI/USD",  name: "Sui",            basePrice: 3.52,      volatility: 0.88, icon: "💧", category: "crypto" },
  { symbol: "DOGE/USD", name: "Dogecoin",       basePrice: 0.32,      volatility: 0.90, icon: "🐕", category: "crypto" },
  { symbol: "SHIB/USD", name: "Shiba Inu",      basePrice: 0.000022,  volatility: 0.95, icon: "🐾", category: "crypto" },
  // ── DeFi / Alt Crypto ─────────────────────────────────────────────────────
  { symbol: "AAVE/USD", name: "Aave",           basePrice: 285.40,    volatility: 0.75, icon: "👻", category: "crypto" },
  { symbol: "MKR/USD",  name: "Maker",          basePrice: 1_850.00,  volatility: 0.68, icon: "Ⓜ", category: "crypto" },
  { symbol: "CRV/USD",  name: "Curve",          basePrice: 0.88,      volatility: 0.82, icon: "🔄", category: "crypto" },
  { symbol: "LDO/USD",  name: "Lido DAO",       basePrice: 2.15,      volatility: 0.80, icon: "🏝", category: "crypto" },
  { symbol: "INJ/USD",  name: "Injective",      basePrice: 24.50,     volatility: 0.85, icon: "💉", category: "crypto" },
  { symbol: "TIA/USD",  name: "Celestia",       basePrice: 12.80,     volatility: 0.88, icon: "🌌", category: "crypto" },
  { symbol: "JUP/USD",  name: "Jupiter",        basePrice: 1.25,      volatility: 0.90, icon: "🪐", category: "crypto" },
  { symbol: "RENDER/USD",name: "Render",        basePrice: 7.85,      volatility: 0.82, icon: "🎨", category: "crypto" },
  { symbol: "FET/USD",  name: "Fetch.ai",       basePrice: 2.35,      volatility: 0.85, icon: "🤖", category: "crypto" },
  { symbol: "PEPE/USD", name: "Pepe",           basePrice: 0.0000125, volatility: 0.98, icon: "🐸", category: "crypto" },
  // ── Forex ─────────────────────────────────────────────────────────────────
  { symbol: "EUR/USD",  name: "Euro",           basePrice: 1.0842,    volatility: 0.08, icon: "€",  category: "forex" },
  { symbol: "GBP/USD",  name: "British Pound",  basePrice: 1.2635,    volatility: 0.09, icon: "£",  category: "forex" },
  { symbol: "USD/JPY",  name: "Japanese Yen",   basePrice: 150.25,    volatility: 0.10, icon: "¥",  category: "forex" },
  { symbol: "AUD/USD",  name: "Australian $",   basePrice: 0.6545,    volatility: 0.10, icon: "A$", category: "forex" },
  { symbol: "USD/CAD",  name: "Canadian $",     basePrice: 1.3580,    volatility: 0.08, icon: "C$", category: "forex" },
  { symbol: "USD/CHF",  name: "Swiss Franc",    basePrice: 0.8825,    volatility: 0.08, icon: "Fr", category: "forex" },
  { symbol: "NZD/USD",  name: "New Zealand $",  basePrice: 0.6125,    volatility: 0.10, icon: "NZ", category: "forex" },
  { symbol: "EUR/GBP",  name: "Euro/Pound",     basePrice: 0.8580,    volatility: 0.07, icon: "€£", category: "forex" },
  { symbol: "EUR/JPY",  name: "Euro/Yen",       basePrice: 162.85,    volatility: 0.10, icon: "€¥", category: "forex" },
  { symbol: "GBP/JPY",  name: "Pound/Yen",      basePrice: 189.90,    volatility: 0.12, icon: "£¥", category: "forex" },
  // ── Commodities ───────────────────────────────────────────────────────────
  { symbol: "XAU/USD",  name: "Gold",           basePrice: 2_635.50,  volatility: 0.15, icon: "🥇", category: "commodity" },
  { symbol: "XAG/USD",  name: "Silver",         basePrice: 30.85,     volatility: 0.22, icon: "🥈", category: "commodity" },
  { symbol: "WTI/USD",  name: "Crude Oil WTI",  basePrice: 72.40,     volatility: 0.30, icon: "🛢", category: "commodity" },
  { symbol: "BRENT/USD",name: "Brent Crude",    basePrice: 76.20,     volatility: 0.28, icon: "🛢", category: "commodity" },
  { symbol: "NG/USD",   name: "Natural Gas",    basePrice: 2.85,      volatility: 0.45, icon: "🔥", category: "commodity" },
  { symbol: "XCU/USD",  name: "Copper",         basePrice: 4.15,      volatility: 0.22, icon: "🔶", category: "commodity" },
  { symbol: "XPT/USD",  name: "Platinum",       basePrice: 985.50,    volatility: 0.20, icon: "⚪", category: "commodity" },
  { symbol: "WHEAT/USD",name: "Wheat",          basePrice: 5.82,      volatility: 0.25, icon: "🌾", category: "commodity" },
  { symbol: "CORN/USD", name: "Corn",           basePrice: 4.55,      volatility: 0.22, icon: "🌽", category: "commodity" },
  { symbol: "COFFEE/USD",name: "Coffee",        basePrice: 2.45,      volatility: 0.28, icon: "☕", category: "commodity" },
];
