"use client";

import { useState } from "react";
import { useStore } from "@/store";
import { cn } from "@/lib/cn";
import { formatPrice, formatPercent } from "@/lib/formatters";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Crypto" },
  { id: "forex", label: "Forex" },
  { id: "commodity", label: "Commodities" },
] as const;

interface SymbolSidebarProps {
  isMobile?: boolean;
}

export function SymbolSidebar({ isMobile = false }: SymbolSidebarProps) {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const symbols = useStore((s) => s.symbols);
  const prices = useStore((s) => s.prices);
  const selectedSymbol = useStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useStore((s) => s.setSelectedSymbol);
  const activeCategory = useStore((s) => s.activeCategory);
  const setActiveCategory = useStore((s) => s.setActiveCategory);
  const [search, setSearch] = useState("");

  const filteredSymbols = symbols.filter((s) => {
    const matchesCategory = activeCategory === "all" || s.category === activeCategory;
    const matchesSearch =
      search === "" ||
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!sidebarOpen) return null;

  const handleSymbolClick = (symbol: string) => {
    setSelectedSymbol(symbol);
    if (isMobile) toggleSidebar();
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-theme",
        isMobile ? "h-screen w-72" : "h-full w-64"
      )}
    >
      {isMobile && (
        <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2">
          <span className="text-sm font-semibold text-foreground">Watchlist</span>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="border-b border-sidebar-border p-3">
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbols..."
            className={cn(
              "w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3",
              "text-xs text-foreground placeholder:text-muted-foreground",
              "outline-none ring-ring focus:ring-1"
            )}
          />
        </div>
      </div>

      <div className="flex gap-1 border-b border-sidebar-border px-3 py-2 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              activeCategory === cat.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSymbols.map((sym) => {
          const tick = prices[sym.symbol];
          const isSelected = selectedSymbol === sym.symbol;
          const changeValue = tick?.change1m ?? 0;

          return (
            <button
              key={sym.symbol}
              onClick={() => handleSymbolClick(sym.symbol)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                isSelected
                  ? "bg-accent/10 border-r-2 border-accent"
                  : "hover:bg-muted/50"
              )}
            >
              <span className="text-base">{sym.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground truncate">
                    {sym.symbol}
                  </span>
                  <span className="font-mono text-xs text-foreground tabular-nums">
                    {tick ? formatPrice(tick.price) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
                    {sym.name}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      changeValue > 0
                        ? "text-success"
                        : changeValue < 0
                          ? "text-danger"
                          : "text-muted-foreground"
                    )}
                  >
                    {tick ? formatPercent(changeValue) : "—"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {filteredSymbols.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            No symbols found
          </div>
        )}
      </div>

      <div className="border-t border-sidebar-border px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {filteredSymbols.length} symbols
        </span>
      </div>
    </aside>
  );
}
