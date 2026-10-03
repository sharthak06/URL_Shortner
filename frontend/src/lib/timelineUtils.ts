import type { ClickItem } from "@/types/url.types";

export type TimeRange = "24h" | "7d" | "30d" | "all";

export interface TimelinePoint {
  label: string;
  fullDate: string;
  count: number;
}

/**
 * Builds localized time-series buckets from click records for the specified range.
 */
export function buildTimelineBuckets(
  clicks: ClickItem[],
  range: TimeRange
): TimelinePoint[] {
  const now = new Date();
  const buckets: TimelinePoint[] = [];

  if (range === "24h") {
    // 24 hourly buckets ending at the current hour
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000);
      d.setMinutes(0, 0, 0);
      const hourStr = d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
      const fullDate = d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      buckets.push({
        label: hourStr,
        fullDate,
        count: 0,
      });
    }

    // Accumulate clicks into corresponding hourly bucket
    clicks.forEach((c) => {
      const clickDate = new Date(c.clickedAt);
      const diffHours = Math.floor((now.getTime() - clickDate.getTime()) / (3600 * 1000));
      if (diffHours >= 0 && diffHours < 24) {
        const bucketIndex = 23 - diffHours;
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].count++;
        }
      }
    });
  } else if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.push({
        label,
        fullDate: d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        count: 0,
      });
    }

    clicks.forEach((c) => {
      const clickDate = new Date(c.clickedAt);
      const diffDays = Math.floor((now.getTime() - clickDate.getTime()) / (24 * 3600 * 1000));
      if (diffDays >= 0 && diffDays < days) {
        const bucketIndex = days - 1 - diffDays;
        if (buckets[bucketIndex]) {
          buckets[bucketIndex].count++;
        }
      }
    });
  } else {
    // "all" - Group by date
    if (clicks.length === 0) {
      return buildTimelineBuckets(clicks, "7d");
    }

    // Default to 14 days baseline
    return buildTimelineBuckets(clicks, "30d");
  }

  return buckets;
}

/**
 * Computes smooth cubic bezier SVG spline path strings (line and closed area).
 */
export function generateSplinePath(
  points: { x: number; y: number }[],
  height: number
): { linePath: string; areaPath: string } {
  if (points.length === 0) return { linePath: "", areaPath: "" };
  if (points.length === 1) {
    const p = points[0];
    return {
      linePath: `M ${p.x} ${p.y}`,
      areaPath: `M ${p.x} ${p.y} L ${p.x} ${height} Z`,
    };
  }

  let linePath = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Catmull-Rom to Cubic Bezier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(1)} ${height} L ${firstPoint.x.toFixed(1)} ${height} Z`;

  return { linePath, areaPath };
}
