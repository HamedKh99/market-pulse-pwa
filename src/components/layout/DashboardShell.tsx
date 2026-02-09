"use client";

import { useStore } from "@/store";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useEffect } from "react";
import { Header } from "./Header";
import { SymbolSidebar } from "./SymbolSidebar";
import { StatusBar } from "./StatusBar";

/**
 * DashboardShell — Responsive layout shell implementing a collapsible
 * sidebar pattern across three breakpoints (mobile overlay / tablet
 * overlay / desktop permanent). Auto-collapses on narrow viewports
 * to avoid obstructing the primary data surface.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  // Collapse sidebar when the viewport shrinks past the tablet breakpoint.
  // Intentionally omits sidebarOpen from deps — we only react to breakpoint transitions.
  useEffect(() => {
    if (isMobile || isTablet) {
      if (sidebarOpen) toggleSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isTablet]);

  return (
    <div className="flex h-screen flex-col bg-background transition-theme">
      <Header />
      <div className="relative flex flex-1 overflow-hidden">
        {sidebarOpen && (isMobile || isTablet) && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        <div
          className={
            isMobile || isTablet
              ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : ""
          }
        >
          <SymbolSidebar isMobile={isMobile} />
        </div>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4">
          {children}
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
