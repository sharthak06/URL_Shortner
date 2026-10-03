import React, { useState, useMemo, useRef } from "react";
import type { ClickItem } from "@/types/url.types";
import {
  type TimeRange,
  buildTimelineBuckets,
  generateSplinePath,
} from "@/lib/timelineUtils";
import { TrendingUp, Info } from "lucide-react";

interface ClickTimelineChartProps {
  clicks: ClickItem[];
  totalClicks: number;
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "All", value: "all" },
];

const SVG_WIDTH = 800;
const SVG_HEIGHT = 200;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 25;
const PADDING_X = 20;

export const ClickTimelineChart: React.FC<ClickTimelineChartProps> = ({
  clicks,
  totalClicks,
}) => {
  const [activeRange, setActiveRange] = useState<TimeRange>("24h");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Build localized buckets
  const buckets = useMemo(() => {
    return buildTimelineBuckets(clicks, activeRange);
  }, [clicks, activeRange]);

  // Compute max count for scaling (minimum 4 to avoid a flat ceiling)
  const maxCount = useMemo(() => {
    const highest = Math.max(...buckets.map((b) => b.count), 0);
    return Math.max(highest, 4);
  }, [buckets]);

  const usableHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const usableWidth = SVG_WIDTH - PADDING_X * 2;

  // Map buckets to (x, y) coordinates
  const points = useMemo(() => {
    if (buckets.length === 0) return [];
    return buckets.map((b, i) => {
      const x = PADDING_X + (i / (buckets.length - 1)) * usableWidth;
      const y = SVG_HEIGHT - PADDING_BOTTOM - (b.count / maxCount) * usableHeight;
      return { x, y, data: b };
    });
  }, [buckets, maxCount, usableWidth, usableHeight]);

  // Generate smooth cubic bezier SVG paths
  const { linePath, areaPath } = useMemo(() => {
    return generateSplinePath(
      points.map((p) => ({ x: p.x, y: p.y })),
      SVG_HEIGHT - PADDING_BOTTOM
    );
  }, [points]);

  // Calculate total clicks in the active range
  const rangeClicksTotal = useMemo(() => {
    return buckets.reduce((sum, b) => sum + b.count, 0);
  }, [buckets]);

  // The API returns at most the latest 100 click events, so busy links are charted
  // from a sample. The oldest sampled click marks where the plotted data really starts.
  const isSampled = totalClicks > clicks.length;
  const oldestSampledLabel = useMemo(() => {
    if (!isSampled || clicks.length === 0) return null;
    const oldest = Math.min(...clicks.map((c) => new Date(c.clickedAt).getTime()));
    return new Date(oldest).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }, [clicks, isSampled]);

  // Mouse move handler for scrubber
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const index = Math.min(
      Math.max(0, Math.round(relativeX * (points.length - 1))),
      points.length - 1
    );
    setHoveredIndex(index);
  };

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  // Select evenly spaced labels for X-axis
  const labelIndices = useMemo(() => {
    if (buckets.length <= 6) return buckets.map((_, i) => i);
    const step = Math.floor(buckets.length / 5);
    return [0, step, step * 2, step * 3, step * 4, buckets.length - 1];
  }, [buckets]);

  return (
    <div className="rounded-xl border border-line-subtle bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] p-5 sm:p-6 w-full space-y-4">
      {/* Chart Header: Title & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-zinc-500" />
              <span>Clicks over time</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              ({rangeClicksTotal} in range)
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </p>
          {isSampled && (
            <p className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
              <Info className="h-3 w-3 shrink-0" />
              <span>
                Showing latest {clicks.length} of {totalClicks.toLocaleString()} clicks
                {oldestSampledLabel && ` · since ${oldestSampledLabel}`}
              </span>
            </p>
          )}
        </div>

        {/* Range Selector Pills */}
        <div className="flex items-center rounded-lg bg-surface p-1 border border-line-subtle self-start sm:self-center">
          {RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => setActiveRange(range.value)}
              className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer ${
                activeRange === range.value
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Spline Canvas Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        className="relative w-full h-[220px] select-none cursor-crosshair overflow-hidden pt-2"
        role="img"
        aria-label="Click volume time-series chart"
      >
        {/* SVG Graphic */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#4f46e5" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          <line
            x1={PADDING_X}
            y1={PADDING_TOP}
            x2={SVG_WIDTH - PADDING_X}
            y2={PADDING_TOP}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1={PADDING_X}
            y1={PADDING_TOP + usableHeight / 2}
            x2={SVG_WIDTH - PADDING_X}
            y2={PADDING_TOP + usableHeight / 2}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1={PADDING_X}
            y1={SVG_HEIGHT - PADDING_BOTTOM}
            x2={SVG_WIDTH - PADDING_X}
            y2={SVG_HEIGHT - PADDING_BOTTOM}
            stroke="rgba(255, 255, 255, 0.1)"
          />

          {/* Area Fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#splineGradient)"
              className="transition-opacity duration-300"
            />
          )}

          {/* Spline Curve Stroke */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#818cf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Scrubber Guideline & Anchor Dot */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={PADDING_TOP}
                x2={hoveredPoint.x}
                y2={SVG_HEIGHT - PADDING_BOTTOM}
                stroke="rgba(129, 140, 248, 0.5)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                fill="#818cf8"
                stroke="#0b0b0c"
                strokeWidth="2"
                className="drop-shadow-md"
              />
            </g>
          )}

          {/* X-Axis Tick Labels */}
          {labelIndices.map((idx) => {
            const pt = points[idx];
            if (!pt) return null;
            return (
              <text
                key={idx}
                x={pt.x}
                y={SVG_HEIGHT - 6}
                textAnchor="middle"
                className="text-[10px] fill-zinc-500 font-mono select-none"
              >
                {pt.data.label}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredPoint && (
          <div
            style={{
              left: `${(hoveredPoint.x / SVG_WIDTH) * 100}%`,
              top: `${Math.max(10, (hoveredPoint.y / SVG_HEIGHT) * 100 - 15)}%`,
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full z-20"
          >
            <div className="rounded-lg bg-zinc-900/95 border border-line px-3 py-1.5 shadow-xl shadow-black/80 backdrop-blur-md space-y-0.5 text-center min-w-[110px]">
              <span className="text-[10px] font-mono text-zinc-400 block whitespace-nowrap">
                {hoveredPoint.data.fullDate}
              </span>
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm font-bold font-mono text-indigo-300 tabular-nums">
                  {hoveredPoint.data.count}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {hoveredPoint.data.count === 1 ? "click" : "clicks"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zero Activity Notice when range has 0 clicks */}
      {rangeClicksTotal === 0 && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface/50 border border-line-subtle text-xs text-zinc-400 font-mono">
          <Info className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <span>
            {totalClicks === 0
              ? "No clicks recorded on this link yet. Real-time telemetry will stream here as clicks occur."
              : isSampled
                ? "No sampled clicks in this window. Older clicks aren't plotted."
                : "0 clicks detected in this specific time window."}
          </span>
        </div>
      )}
    </div>
  );
};
