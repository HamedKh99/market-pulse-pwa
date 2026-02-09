"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/formatters";

interface PriceCellProps {
  price: number;
  previousDirection?: "up" | "down" | "neutral";
}

/**
 * PriceCell — CSS-animation-driven flash indicator for price changes.
 *
 * Avoids React re-render storms: instead of toggling state we mutate
 * the DOM node's classList directly, applying a one-shot CSS class
 * (`flash-up` / `flash-down`) and removing it after the 600 ms
 * animation completes. This keeps the per-frame React work to zero
 * extra reconciliation passes.
 */
export function PriceCell({ price, previousDirection = "neutral" }: PriceCellProps) {
  const prevPriceRef = useRef(price);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el || price === prevPriceRef.current) return;

    const cls = price > prevPriceRef.current ? "flash-up" : "flash-down";
    el.classList.add(cls);
    prevPriceRef.current = price;

    const timer = setTimeout(() => {
      el.classList.remove("flash-up", "flash-down");
    }, 600);
    return () => clearTimeout(timer);
  }, [price]);

  return (
    <span
      ref={spanRef}
      className={cn(
        "inline-block rounded px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums",
        previousDirection === "up"
          ? "text-success"
          : previousDirection === "down"
            ? "text-danger"
            : "text-foreground"
      )}
    >
      {formatPrice(price)}
    </span>
  );
}
