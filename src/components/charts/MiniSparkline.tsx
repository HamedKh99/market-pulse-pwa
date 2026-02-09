"use client";

import { useMemo } from "react";

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * MiniSparkline — Zero-dependency inline SVG sparkline for grid cells.
 *
 * Intentionally bypasses Recharts: each grid row needs its own sparkline,
 * and mounting a full Recharts `<LineChart>` per row would add ~50 ms of
 * React tree overhead for 50 symbols. Raw `<svg>` + memoised `useMemo`
 * keeps each sparkline render under 0.1 ms.
 */
export function MiniSparkline({
  data,
  width = 80,
  height = 24,
  className = "",
}: MiniSparklineProps) {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 1;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((value, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return `${x},${y}`;
    });

    const isUp = data[data.length - 1] >= data[0];

    return {
      path: `M ${points.join(" L ")}`,
      color: isUp ? "var(--chart-up)" : "var(--chart-down)",
      fillPath: `M ${points[0].split(",")[0]},${height} L ${points.join(" L ")} L ${points[points.length - 1].split(",")[0]},${height} Z`,
      fillColor: isUp ? "var(--chart-up)" : "var(--chart-down)",
    };
  }, [data, width, height]);

  if (!pathData) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-muted-foreground">—</span>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <path
        d={pathData.fillPath}
        fill={pathData.fillColor}
        opacity={0.1}
      />
      <path
        d={pathData.path}
        fill="none"
        stroke={pathData.color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
