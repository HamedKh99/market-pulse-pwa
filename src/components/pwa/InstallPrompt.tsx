"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { cn } from "@/lib/cn";

/**
 * InstallPrompt — A subtle bottom-right toast prompting PWA installation.
 * Only shows when the browser fires `beforeinstallprompt` and the user
 * hasn't dismissed it this session.
 */
export function InstallPrompt() {
  const { canInstall, promptInstall, dismiss } = usePWAInstall();

  // Respect session dismissal
  if (typeof window !== "undefined" && sessionStorage.getItem("mp-install-dismissed")) {
    return null;
  }

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-2xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <svg
            className="h-5 w-5 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Install Market Pulse</p>
          <p className="text-xs text-muted-foreground">
            Get the full app experience
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={dismiss}
            className="rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            Later
          </button>
          <button
            onClick={promptInstall}
            className={cn(
              "rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground",
              "hover:bg-accent/90 transition-colors"
            )}
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
