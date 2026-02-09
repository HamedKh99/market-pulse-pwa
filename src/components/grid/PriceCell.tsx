"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/formatters";

interface PriceCellProps {
  price: number;
  previousDirection?: "up" | "down" | "neutral";
}

/**
 * PriceCell — A table cell that flashes green/red on price changes.
 *
 * Uses CSS animations triggered by key changes to avoid re-render storms.
 * The flash animation is defined in globals.css (flash-up / flash-down).
 */
export function PriceCell({ price, previousDirection = "neutral" }: PriceCellProps) {
  const prevPriceRef = useRef(price);
  const [flashClass, setFlashClass] = useState("");

  useEffect(() => {
    if (price !== prevPriceRef.current) {
      const direction = price > prevPriceRef.current ? "up" : "down";
      setFlashClass(direction === "up" ? "flash-up" : "flash-down");
      prevPriceRef.current = price;

      // Remove flash class after animation completes
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
