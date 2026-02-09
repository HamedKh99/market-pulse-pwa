"use client";

import { createColumnHelper } from "@tanstack/react-table";
import type { TickData } from "@/types/market";
import { formatPercent, formatVolume } from "@/lib/formatters";
import { PriceCell } from "./PriceCell";
import { MiniSparkline } from "@/components/charts/MiniSparkline";
import { cn } from "@/lib/cn";

/** Augment TanStack Table's ColumnMeta to support our flex-grow layout. */
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    grow?: boolean;
  }
}

/** Row data shape — merges static symbol config with live tick + sparkline. */
export interface MarketRow {
  symbol: string;
  name: string;
  icon: string;
  category: string;
  tick: TickData | undefined;
  sparkline: number[];
}

const columnHelper = createColumnHelper<MarketRow>();

/** Full desktop column set — all 8 columns including sparkline. */
export const marketColumns = [
  columnHelper.display({
    id: "rank",
    header: () => <span className="text-xs text-muted-foreground">#</span>,
    cell: (info) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {info.row.index + 1}
      </span>
    ),
    size: 40,
  }),

  columnHelper.accessor("symbol", {
    header: () => <span className="text-xs font-medium text-muted-foreground">Symbol</span>,
    cell: (info) => (
      <div className="flex items-center gap-2">
        <span className="text-sm">{info.row.original.icon}</span>
        <div className="min-w-0">
          <div className="text-xs font-medium text-foreground truncate">{info.getValue()}</div>
          <div className="text-xs text-muted-foreground truncate">{info.row.original.name}</div>
        </div>
      </div>
    ),
    size: 160,
  }),

  columnHelper.accessor((row) => row.tick?.price ?? 0, {
    id: "price",
    header: () => <span className="text-xs font-medium text-muted-foreground text-right block">Price</span>,
    cell: (info) => {
      const tick = info.row.original.tick;
      if (!tick) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="text-right">
          <PriceCell price={tick.price} previousDirection={tick.direction} />
        </div>
      );
    },
    size: 120,
  }),

  columnHelper.accessor((row) => row.tick?.change1m ?? 0, {
    id: "change1m",
    header: () => <span className="text-xs font-medium text-muted-foreground text-right block">1m %</span>,
    cell: (info) => {
      const value = info.getValue();
      return (
        <span
          className={cn(
            "block text-right font-mono text-xs font-medium tabular-nums",
            value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted-foreground"
          )}
        >
          {formatPercent(value)}
        </span>
      );
    },
    size: 80,
  }),

  columnHelper.accessor((row) => row.tick?.change1h ?? 0, {
    id: "change1h",
    header: () => <span className="text-xs font-medium text-muted-foreground text-right block">1h %</span>,
    cell: (info) => {
      const value = info.getValue();
      return (
        <span
          className={cn(
            "block text-right font-mono text-xs font-medium tabular-nums",
            value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted-foreground"
          )}
        >
          {formatPercent(value)}
        </span>
      );
    },
    size: 80,
  }),

  columnHelper.accessor((row) => row.tick?.change24h ?? 0, {
    id: "change24h",
    header: () => <span className="text-xs font-medium text-muted-foreground text-right block">24h %</span>,
    cell: (info) => {
      const value = info.getValue();
      return (
        <span
          className={cn(
            "block text-right font-mono text-xs font-medium tabular-nums",
            value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted-foreground"
          )}
        >
          {formatPercent(value)}
        </span>
      );
    },
    size: 80,
  }),

  columnHelper.accessor((row) => row.tick?.volume24h ?? 0, {
    id: "volume",
    header: () => <span className="text-xs font-medium text-muted-foreground text-right block">24h Vol</span>,
    cell: (info) => (
      <span className="block text-right font-mono text-xs text-muted-foreground tabular-nums">
        ${formatVolume(info.getValue())}
      </span>
    ),
    size: 100,
  }),

  columnHelper.display({
    id: "sparkline",
    header: () => <span className="text-xs font-medium text-muted-foreground">Last 60s</span>,
    cell: (info) => (
      <MiniSparkline data={info.row.original.sparkline} width={80} height={24} />
    ),
    size: 100,
  }),
];

/** Compact mobile column set — 4 columns with wider symbol for touch targets. */
export const mobileColumns = [
  columnHelper.accessor("symbol", {
    header: () => <span className="text-xs font-medium text-muted-foreground">Symbol</span>,
    cell: (info) => (
      <div className="flex items-center gap-2">
        <span className="text-sm">{info.row.original.icon}</span>
        <div className="min-w-0">
          <div className="text-xs font-medium text-foreground truncate">{info.getValue()}</div>
          <div className="text-xs text-muted-foreground truncate">{info.row.original.name}</div>
        </div>
      </div>
    ),
    size: 130,
    meta: { grow: true },
  }),

  columnHelper.accessor((row) => row.tick?.price ?? 0, {
    id: "price",
    header: () => <span className="text-xs font-medium text-muted-foreground text-right block">Price</span>,
    cell: (info) => {
      const tick = info.row.original.tick;
      if (!tick) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="text-right">
          <PriceCell price={tick.price} previousDirection={tick.direction} />
        </div>
      );
    },
    size: 100,
  }),

  columnHelper.accessor((row) => row.tick?.change1m ?? 0, {
    id: "change1m",
    header: () => <span className="text-xs font-medium text-muted-foreground text-right block">Change</span>,
    cell: (info) => {
      const value = info.getValue();
      return (
        <span
          className={cn(
            "block text-right font-mono text-xs font-medium tabular-nums",
            value > 0 ? "text-success" : value < 0 ? "text-danger" : "text-muted-foreground"
          )}
        >
          {formatPercent(value)}
        </span>
      );
    },
    size: 70,
  }),

  columnHelper.display({
    id: "sparkline",
    header: () => null,
    cell: (info) => (
      <MiniSparkline data={info.row.original.sparkline} width={48} height={20} />
    ),
    size: 56,
  }),
];
