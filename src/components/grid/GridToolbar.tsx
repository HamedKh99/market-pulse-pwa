"use client";

import { cn } from "@/lib/cn";

interface GridToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  totalRows: number;
  filteredRows: number;
}

/**
 * GridToolbar — Search input and row count display above the market grid.
 */
export function GridToolbar({
  searchValue,
  onSearchChange,
  totalRows,
  filteredRows,
}: GridToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-3">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-foreground">Market Overview</h3>
        <span className="text-xs text-muted-foreground">
          {filteredRows === totalRows
            ? `${totalRows} symbols`
            : `${filteredRows} of ${totalRows} symbols`}
        </span>
      </div>

      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter symbols..."
          className={cn(
            "w-48 rounded-lg border border-border bg-background py-1.5 pl-8 pr-3",
            "text-xs text-foreground placeholder:text-muted-foreground",
            "outline-none ring-ring focus:ring-1"
          )}
        />
      </div>
    </div>
  );
}
