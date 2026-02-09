"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useStore } from "@/store";
import { formatPrice, formatTime } from "@/lib/formatters";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ChartDataPoint {
  time: number;
  timeLabel: string;
  price: number;
  volume: number;
}

/**
 * PriceLineChart — Real-time streaming line chart using Recharts.
 *
 * Key performance decisions:
 * - isAnimationActive={false} — prevents animation overhead on streaming updates
 * - Fixed data window (last 200 candles) — bounded memory
 * - Memoized data transform — only recomputes when candles change
 * - Responsive height — shorter on mobile
 */
const EMPTY_CANDLES: readonly never[] = [];

export function PriceLineChart() {
  const selectedSymbol = useStore((s) => s.selectedSymbol);
  const candles = useStore((s) => s.candles[s.selectedSymbol] ?? EMPTY_CANDLES);
  const isMobile = useMediaQuery("(max-width: 639px)");

  const chartHeight = isMobile ? 240 : 350;

  // Transform candle data to chart format
  const chartData: ChartDataPoint[] = useMemo(() => {
    return candles.map((c) => ({
      time: c.time,
      timeLabel: formatTime(c.time),
      price: c.close,
      volume: c.volume,
    }));
  }, [candles]);

  // Compute Y-axis domain with padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    const prices = chartData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || max * 0.01;
    return [min - padding, max + padding];
  }, [chartData]);

  // Determine trend color
  const trendColor = useMemo(() => {
    if (chartData.length < 2) return "var(--chart-line)";
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    return last >= first ? "var(--chart-up)" : "var(--chart-down)";
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: chartHeight }}>
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <svg className="h-6 w-6 text-accent animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">
            Waiting for data...
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Connecting to {selectedSymbol} stream
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={isMobile
            ? { top: 4, right: 4, bottom: 0, left: 4 }
            : { top: 8, right: 8, bottom: 0, left: 8 }
          }
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--chart-grid)"
            opacity={0.5}
            vertical={false}
          />

          <XAxis
            dataKey="timeLabel"
            tick={{ fontSize: isMobile ? 9 : 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={isMobile ? 40 : 60}
          />

          <YAxis
            domain={yDomain}
            tick={{ fontSize: isMobile ? 9 : 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatPrice(v)}
            width={isMobile ? 60 : 80}
            orientation="right"
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "var(--muted-foreground)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          {/* Opening price reference line */}
          {chartData.length > 0 && (
            <ReferenceLine
              y={chartData[0].price}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
            />
          )}

          <Line
            type="monotone"
            dataKey="price"
            stroke={trendColor}
            strokeWidth={isMobile ? 1.5 : 2}
            dot={false}
            activeDot={{
              r: 4,
              fill: trendColor,
              stroke: "var(--card)",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
            fill="url(#priceGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-foreground tabular-nums">
        {formatPrice(payload[0].value)}
      </p>
    </div>
  );
}
