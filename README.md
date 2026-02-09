# Market Pulse PWA ⚡

**A high-frequency financial data dashboard built with Next.js 16, Web Workers, and WebSockets.**

> Real-time streaming of 50 instruments across crypto, forex, and commodities — with sub-10 ms UI updates, virtualized grids, and full offline support as an installable PWA.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socketdotio)
![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa)

<p align="center">
  <img src="./public/screenshots/preview.jpg" alt="Market Pulse Dashboard" width="900" />
</p>

---

## 🚀 Key Technical Highlights

| Concern | Approach | Why it matters |
|---|---|---|
| **60 FPS under load** | All tick parsing, OHLC aggregation, and sparkline computation run inside a **dedicated Web Worker**. The main thread only receives one coalesced `postMessage` per animation frame. | At 10 ticks/sec × 50 symbols, raw JSON handling on the UI thread would consume 2–4 ms per burst — leaving too little headroom for React reconciliation. |
| **Virtualized grid** | `@tanstack/react-virtual` renders only the ~15–20 visible rows. Column set swaps responsively at the `sm` breakpoint. | DOM node count stays constant regardless of instrument count, preventing layout thrashing. |
| **Streaming charts** | Recharts with `isAnimationActive={false}` and a capped 200-candle window. | Disabling spring animations avoids cumulative repaint debt on every data push; the fixed window bounds SVG path complexity. |
| **Real-time transport** | Socket.io (`/market` namespace) with WebSocket-first, long-poll fallback, and infinite reconnect. | Corporate proxies that strip `Upgrade` headers degrade gracefully instead of silently failing. |
| **Offline-first PWA** | Service Worker (Workbox) + periodic `localStorage` snapshots (5 s cadence). Cache-first navigation with a `/offline` fallback document. | Users see stale-but-useful prices immediately on reconnect; install prompt respects session dismissal. |
| **Type-safe boundary** | Discriminated-union message protocol (`MainToWorkerMessage` / `WorkerToMainMessage`) and typed Socket.io event maps. | Compile-time guarantees across the WebSocket and `postMessage` boundaries — no stringly-typed event buses. |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.1 (App Router, Turbopack) |
| **UI Runtime** | React 19 (React Compiler enabled via `babel-plugin-react-compiler`) |
| **State** | Zustand 5 — slice-based architecture with granular selectors |
| **Async / Threading** | Web Workers API (Turbopack-resolved `.worker.ts`) |
| **Transport** | Socket.io 4 (bi-directional, typed event maps) |
| **Styling** | Tailwind CSS v4 (zero-runtime, PostCSS) |
| **Charts** | Recharts 3 (customized streaming line chart) + raw SVG sparklines |
| **Grid** | TanStack Table 8 + TanStack Virtual 3 |
| **PWA** | `@ducanh2912/next-pwa` (Workbox, service worker, manifest) |
| **Server** | Custom `http.createServer` + Socket.io + GBM price engine |

---

## 📦 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/market-pulse-pwa.git
cd market-pulse-pwa

# Install dependencies
npm install

# Start the development server (Next.js + Socket.io on port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the demo credentials:

| Email | Password |
|---|---|
| `admin@marketpulse.io` | `admin123` |
| `demo@marketpulse.io` | `demo123` |

### Production build

```bash
npm run build
npm start
```

---

## 🏗 Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│  Browser                                                       │
│                                                                │
│  ┌──────────┐   postMessage    ┌───────────────────────┐       │
│  │  Socket   │ ──────────────▶ │  tickProcessor.worker │       │
│  │  (io)     │                 │  ┌─ Ring buffers      │       │
│  └──────────┘                  │  ├─ OHLC aggregation  │       │
│       ▲                        │  └─ 16 ms throttle    │       │
│       │ WebSocket / Polling    └──────────┬────────────┘       │
│       │                                   │ BATCH_UPDATE       │
│       │                        ┌──────────▼────────────┐       │
│       │                        │  Zustand Store         │       │
│       │                        │  (tick / market / ui)  │       │
│       │                        └──────────┬────────────┘       │
│       │                                   │ selectors          │
│       │                        ┌──────────▼────────────┐       │
│       │                        │  React Component Tree  │       │
│       │                        │  ┌─ PriceLineChart    │       │
│       │                        │  ├─ MarketGrid (virt) │       │
│       │                        │  └─ SymbolSidebar     │       │
│       │                        └───────────────────────┘       │
│       │                                                        │
│  ┌────┴──────────────────────────────────────┐                 │
│  │  Service Worker (Workbox)                 │                 │
│  │  ┌─ Cache-first nav  ┌─ /offline fallback │                 │
│  └───────────────────────────────────────────┘                 │
└────────────────────────────────────────────────────────────────┘
         ▲
         │  HTTP + WS
┌────────┴───────────────────────────────────────────────────────┐
│  Server (server.ts)                                            │
│  ┌─ Next.js request handler                                    │
│  ├─ Socket.io /market namespace                                │
│  └─ GBM Price Engine (100 ms tick interval, 50 symbols)        │
└────────────────────────────────────────────────────────────────┘
```

### Data flow in one sentence

**Socket.io tick → `postMessage` to Worker → buffer + aggregate + throttle → single `BATCH_UPDATE` back to main thread → Zustand `set()` → React selectors re-render only changed widgets.**

---

## 🧩 Architectural Decisions

### Why Web Workers?

At 10 ticks/sec across 50 symbols, the naive approach — parsing JSON, computing OHLC candles, maintaining sparkline ring buffers, and deriving Δ% — would consume 2–4 ms per burst on the main thread. With React reconciliation, layout, and paint also competing for the 16.67 ms frame budget, frames would routinely drop below 60 FPS.

The Worker absorbs the entire parsing and aggregation pipeline. A `setInterval(emitBatchUpdate, 16)` inside the Worker coalesces all ticks received between frames into **one** structured-clone `postMessage`, guaranteeing the main thread only pays the cost of a single message per frame — no matter how many ticks arrived.

### Why TanStack Virtual?

50 symbols × 8 columns = 400 DOM cells. At 60 FPS, any price change triggers a cell repaint. Without virtualization, the browser reconciles all 400 cells on every tick batch. TanStack Virtual reduces the active DOM to ~120 cells (15 visible rows × 8 columns), cutting layout and paint time by 70 %+.

### The PWA Strategy

| Route type | Strategy | Rationale |
|---|---|---|
| **App shell** (HTML, JS, CSS) | **Cache-first** (`aggressiveFrontEndNavCaching`) | Instant load; update in background. |
| **API / WebSocket** | **Network-only** | Real-time data must be fresh. |
| **Offline fallback** | `/offline` document | Graceful degradation with cached price snapshot from `localStorage`. |

`localStorage` snapshots are written every 5 seconds (not per-tick) to avoid synchronous I/O thrashing. A 5-minute TTL prevents stale data from persisting after long periods offline.

---

## 📂 Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout (fonts, PWA wrappers, ThemeProvider)
│   ├── page.tsx          # Home — AuthGate → DashboardShell → DashboardContent
│   ├── login/page.tsx    # Standalone login route
│   └── offline/page.tsx  # PWA offline fallback
├── components/
│   ├── auth/             # AuthGate, LoginForm
│   ├── charts/           # PriceLineChart, MiniSparkline (raw SVG)
│   ├── dashboard/        # DashboardContent, DataProvider (pipeline orchestrator)
│   ├── grid/             # MarketGrid (virtualized), PriceCell (flash animation), columns
│   ├── layout/           # DashboardShell, Header, StatusBar, SymbolSidebar
│   ├── pwa/              # InstallPrompt, OfflineBanner
│   └── theme/            # ThemeProvider (dark/light + system preference sync)
├── hooks/                # useSocket, useTickWorker, useMediaQuery, useOnlineStatus, usePWAInstall
├── lib/                  # cn (Tailwind merge), formatters, offlineCache
├── mocks/                # GBM priceEngine, 50-symbol config
├── store/                # Zustand slices (ui, auth, tick, market) + granular selectors
├── types/                # Shared TypeScript interfaces (market, socket)
└── workers/              # tickProcessor.worker.ts, protocol.ts (discriminated unions)
```

---

## 🔮 Future Improvements

- **Protocol Buffers** — Replace JSON tick payloads with Protobuf for ~60 % smaller wire frames and faster deserialization in the Worker.
- **WASM Technical Indicators** — Compile RSI / MACD / Bollinger Band calculations to WebAssembly for near-native performance on large candle datasets.
- **SharedArrayBuffer** — Explore zero-copy data transfer between Worker and main thread (requires `Cross-Origin-Isolation` headers).
- **Server-Sent Events fallback** — For environments where WebSocket is blocked entirely, fall back to SSE for read-only tick streams.
- **E2E testing** — Playwright tests covering offline → online transitions, PWA install flow, and real-time data rendering.

---

## 📄 License

MIT
