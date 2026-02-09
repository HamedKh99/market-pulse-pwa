"use client";

import { useEffect } from "react";
import { useStore } from "@/store";

/**
 * ThemeProvider — Hydrates theme from localStorage and syncs the
 * `dark` class on <html> for Tailwind dark mode.
 *
 * Must be mounted inside the root layout as a client component.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setTheme = useStore((s) => s.setTheme);

  useEffect(() => {
    // Hydrate from localStorage or system preference
    const stored = localStorage.getItem("mp-theme") as "light" | "dark" | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored ?? (systemDark ? "dark" : "light");

    setTheme(theme);

    // Listen for system preference changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("mp-theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setTheme]);

  return <>{children}</>;
}
