"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useStore } from "@/store";
import { marketColumns, mobileColumns, type MarketRow } from "./columns";
import { GridToolbar } from "./GridToolbar";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const ROW_HEIGHT = 52;
const MOBILE_ROW_HEIGHT = 48;
const EMPTY_SPARKLINE: readonly number[] = [];

/**
 * MarketGrid — Virtualized data grid rendering 50+ symbols at 60 FPS.
 *
 * Virtualization via `@tanstack/react-virtual` ensures only ~15-20 visible
 * rows are in the DOM at any time, avoiding layout thrashing that would
 * otherwise occur when reconciling thousands of price-cell updates.
 *
 * Column set is swapped at the `sm` breakpoint — mobile gets 4 compact
 * columns, desktop gets the full 8 — via a memoised column reference
 * so the table instance is never re-created on resize.
 */
export function MarketGrid() {
  const symbols = useStore((s) => s.symbols);
  const prices = useStore((s) => s.prices);
  const sparklines = useStore((s) => s.sparklines);
  const selectedSymbol = useStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const isMobile = useMediaQuery("(max-width: 639px)");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const parentRef = useRef<HTMLDivElement>(null);
  const rowHeight = isMobile ? MOBILE_ROW_HEIGHT : ROW_HEIGHT;

  // Merge static symbol config with live tick data. Memoised to avoid
  // re-allocating the row array on every Zustand notification.
  const data: MarketRow[] = useMemo(() => {
    return symbols.map((sym) => ({
      symbol: sym.symbol,
      name: sym.name,
      icon: sym.icon,
      category: sym.category,
      tick: prices[sym.symbol],
      sparkline: sparklines[sym.symbol] ?? EMPTY_SPARKLINE,
    }));
  }, [symbols, prices, sparklines]);

  const columns = useMemo(
    () => (isMobile ? mobileColumns : marketColumns) as ColumnDef<MarketRow, unknown>[],
    [isMobile]
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns unmemoizable functions by design; compiler already skips this component.
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase();
      return (
        row.original.symbol.toLowerCase().includes(search) ||
        row.original.name.toLowerCase().includes(search)
      );
    },
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const handleRowClick = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
    },
    [setSelectedSymbol]
  );

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-3 sm:p-4 pb-0">
        <GridToolbar
          searchValue={globalFilter}
          onSearchChange={setGlobalFilter}
          totalRows={data.length}
          filteredRows={rows.length}
        />
      </div>

      <div className="px-3 sm:px-4">
        <div className="flex border-b border-border py-2">
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className={cn(
                  "flex shrink-0 items-center px-1.5 sm:px-2",
                  header.column.getCanSort() && "cursor-pointer select-none hover:bg-muted/50 rounded"
                )}
                style={{ width: header.getSize(), flexGrow: header.column.columnDef.meta?.grow ? 1 : 0 }}
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getIsSorted() && (
                  <span className="ml-1 text-xs text-accent">
                    {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Only the visible slice is mounted — see `overscan: 5` for smooth scroll. */}
      <div
        ref={parentRef}
        className="overflow-auto px-3 sm:px-4"
        style={{ maxHeight: isMobile ? "320px" : "400px" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const isSelected = row.original.symbol === selectedSymbol;

            return (
              <div
                key={row.id}
                className={cn(
                  "absolute left-0 flex w-full items-center border-b border-border/50 transition-colors cursor-pointer",
                  isSelected
                    ? "bg-accent/5"
                    : "hover:bg-muted/30"
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => handleRowClick(row.original.symbol)}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="flex shrink-0 items-center px-1.5 sm:px-2"
                    style={{ width: cell.column.getSize(), flexGrow: cell.column.columnDef.meta?.grow ? 1 : 0 }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {rows.length === 0 && (
        <div className="flex h-32 items-center justify-center">
          <span className="text-xs text-muted-foreground">
            {globalFilter ? "No symbols match your search" : "Waiting for data..."}
          </span>
        </div>
      )}
    </div>
  );
}
