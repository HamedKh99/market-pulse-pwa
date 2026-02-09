"use client";

import { useEffect } from "react";
import { useStore } from "@/store";

/**
 * ThemeProvider — Hydrates the theme preference from `localStorage`
 * (falling back to `prefers-color-scheme`) and keeps the `dark` class
 * on `<html>` in sync for Tailwind's `darkMode: 'class'` strategy.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setTheme = useStore((s) => s.setTheme);

  useEffect(() => {
    const stored = localStorage.getItem("mp-theme") as "light" | "dark" | null;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored ?? (systemDark ? "dark" : "light");

    setTheme(theme);

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
