"use client";

import { useStore } from "@/store";
import { formatPrice, formatPercent, formatVolume } from "@/lib/formatters";
import { cn } from "@/lib/cn";
import { TIMEFRAMES } from "@/types/market";
import { PriceLineChart } from "@/components/charts/PriceLineChart";
import { MarketGrid } from "@/components/grid/MarketGrid";
import { DataProvider } from "./DataProvider";

/**
 * DashboardContent — Main content area of the dashboard.
 *
 * Wraps everything in DataProvider which manages the
 * Socket.io → Worker → Zustand pipeline. All child components
 * reactively subscribe to Zustand slices via selectors.
 */
export function DashboardContent() {
  return (
    <DataProvider>
      <DashboardInner />
    </DataProvider>
  );
}

function DashboardInner() {
  const selectedSymbol = useStore((s) => s.selectedSymbol);
  const timeframe = useStore((s) => s.timeframe);
  const setTimeframe = useStore((s) => s.setTimeframe);
  const tick = useStore((s) => s.prices[s.selectedSymbol]);
  const symbolConfig = useStore((s) =>
    s.symbols.find((sym) => sym.symbol === s.selectedSymbol)
  );

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* ── Symbol Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {symbolConfig && (
            <span className="text-lg sm:text-xl">{symbolConfig.icon}</span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                {selectedSymbol}
              </h2>
              {symbolConfig && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {symbolConfig.name}
                </span>
              )}
            </div>
            {tick && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                  {formatPrice(tick.price)}
                </span>
                <span
                  className={cn(
                    "rounded-md px-1.5 sm:px-2 py-0.5 text-xs font-medium",
                    tick.change1m > 0
                      ? "bg-success/10 text-success"
                      : tick.change1m < 0
                        ? "bg-danger/10 text-danger"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {formatPercent(tick.change1m)}
                </span>
                <span
                  className={cn(
                    "hidden sm:inline-block rounded-md px-2 py-0.5 text-xs font-medium",
                    tick.change24h > 0
                      ? "bg-success/10 text-success"
                      : tick.change24h < 0
                        ? "bg-danger/10 text-danger"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {formatPercent(tick.change24h)} 24h
                </span>
                {tick.direction !== "neutral" && (
                  <span className={cn(
                    "text-base sm:text-lg",
                    tick.direction === "up" ? "text-success" : "text-danger"
                  )}>
                    {tick.direction === "up" ? "▲" : "▼"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timeframe Toggle */}
        <div className="flex items-center gap-0.5 sm:gap-1 rounded-lg bg-muted p-0.5 sm:p-1 self-start sm:self-auto">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "rounded-md px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium transition-colors",
                timeframe === tf
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart Panel ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-2 sm:p-4">
        <PriceLineChart />
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      {tick && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
          {[
            { label: "Bid", value: formatPrice(tick.bid), color: "text-success" },
            { label: "Ask", value: formatPrice(tick.ask), color: "text-danger" },
            { label: "Spread", value: formatPrice(tick.spread), color: "text-foreground" },
            { label: "24h Vol", value: `$${formatVolume(tick.volume24h)}`, color: "text-foreground" },
            { label: "24h High", value: formatPrice(tick.high24h), color: "text-success" },
            { label: "24h Low", value: formatPrice(tick.low24h), color: "text-danger" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border bg-card px-2 sm:px-3 py-2"
            >
              <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              <p className={cn("mt-0.5 font-mono text-xs sm:text-sm font-semibold tabular-nums truncate", stat.color)}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Market Grid ────────────────────────────────────────────────── */}
      <MarketGrid />
    </div>
  );
}
