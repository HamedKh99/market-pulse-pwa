"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/formatters";

interface PriceCellProps {
  price: number;
  previousDirection?: "up" | "down" | "neutral";
}

/**
 * PriceCell — CSS-animation-driven flash indicator for price changes.
 *
 * Avoids React re-render storms: instead of toggling a state boolean
 * that would propagate through the entire virtualized row, we apply a
 * one-shot CSS class (`flash-up` / `flash-down`) and clear it after
 * the 600 ms animation completes. This keeps the per-frame React
 * work limited to a single `className` mutation on the DOM node.
 */
export function PriceCell({ price, previousDirection = "neutral" }: PriceCellProps) {
  const prevPriceRef = useRef(price);
  const [flashClass, setFlashClass] = useState("");

  useEffect(() => {
    if (price !== prevPriceRef.current) {
      const direction = price > prevPriceRef.current ? "up" : "down";
      setFlashClass(direction === "up" ? "flash-up" : "flash-down");
      prevPriceRef.current = price;

      const timer = setTimeout(() => setFlashClass(""), 600);
      return () => clearTimeout(timer);
    }
  }, [price]);

  return (
    <span
      className={cn(
        "inline-block rounded px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums",
        flashClass,
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
