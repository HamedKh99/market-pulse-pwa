"use client";

import { useStore } from "@/store";
import { cn } from "@/lib/cn";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function Header() {
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const connectionStatus = useStore((s) => s.connectionStatus);
  const isOnline = useOnlineStatus();

  return (
    <header className="flex h-12 sm:h-14 items-center justify-between border-b border-header-border bg-header px-3 sm:px-4 transition-theme">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-accent/10">
            <svg
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:inline">Market Pulse</span>
          <span className="text-sm font-semibold text-foreground sm:hidden">MP</span>
        </div>

        <div className="ml-1 sm:ml-2 flex items-center gap-1.5">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              !isOnline
                ? "bg-danger"
                : connectionStatus === "connected"
                  ? "bg-success animate-pulse-live"
                  : connectionStatus === "connecting"
                    ? "bg-warning animate-pulse"
                    : "bg-danger"
            )}
          />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {!isOnline ? "Offline" : connectionStatus === "connected" ? "LIVE" : connectionStatus === "connecting" ? "Reconnecting..." : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-1.5 sm:p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {user && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
              {user.avatar}
            </div>
            <button
              onClick={logout}
              className="hidden sm:block rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
