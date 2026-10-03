import React, { useMemo } from "react";
import type { ClickItem } from "@/types/url.types";
import {
  Laptop,
  Smartphone,
  Tablet,
  Server,
  Layers,
} from "lucide-react";
import {
  classifyDevice,
  resolveBrowserName,
  resolveOsName,
  type DeviceCategory,
} from "@/lib/analyticsUtils";

interface DeviceBreakdownProps {
  clicks: ClickItem[];
  totalClicks: number;
}

interface CategoryStats {
  category: DeviceCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  percentage: number;
  colorClass: string;
  barColor: string;
  dotColor: string;
}

export const DeviceBreakdown: React.FC<DeviceBreakdownProps> = ({
  clicks,
  totalClicks,
}) => {
  const hasData = clicks && clicks.length > 0;

  // Aggregate device categories
  const { deviceStats, topBrowsers, topOs } = useMemo(() => {
    if (!clicks || clicks.length === 0) {
      return {
        deviceStats: [] as CategoryStats[],
        topBrowsers: [] as Array<{ name: string; count: number }>,
        topOs: [] as Array<{ name: string; count: number }>,
      };
    }

    const counts: Record<DeviceCategory, number> = {
      Desktop: 0,
      Mobile: 0,
      Tablet: 0,
      Unknown: 0,
    };

    const browserCounts: Record<string, number> = {};
    const osCounts: Record<string, number> = {};

    for (const click of clicks) {
      const dev = classifyDevice(click.device, click.userAgent);
      counts[dev] = (counts[dev] || 0) + 1;

      const browser = resolveBrowserName(click.browser, click.userAgent);
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;

      const os = resolveOsName(click.os, click.userAgent);
      osCounts[os] = (osCounts[os] || 0) + 1;
    }

    const totalSampled = Math.max(clicks.length, 1);

    const stats: CategoryStats[] = [
      {
        category: "Desktop",
        label: "Desktop",
        icon: Laptop,
        count: counts.Desktop,
        percentage: Math.round((counts.Desktop / totalSampled) * 100),
        colorClass: "text-indigo-400",
        barColor: "bg-indigo-500",
        dotColor: "bg-indigo-400",
      },
      {
        category: "Mobile",
        label: "Mobile",
        icon: Smartphone,
        count: counts.Mobile,
        percentage: Math.round((counts.Mobile / totalSampled) * 100),
        colorClass: "text-indigo-300",
        barColor: "bg-indigo-400",
        dotColor: "bg-indigo-300",
      },
      {
        category: "Tablet",
        label: "Tablet",
        icon: Tablet,
        count: counts.Tablet,
        percentage: Math.round((counts.Tablet / totalSampled) * 100),
        colorClass: "text-zinc-400",
        barColor: "bg-zinc-500",
        dotColor: "bg-zinc-400",
      },
      {
        category: "Unknown",
        label: "Unknown / Bot",
        icon: Server,
        count: counts.Unknown,
        percentage: Math.round((counts.Unknown / totalSampled) * 100),
        colorClass: "text-zinc-500",
        barColor: "bg-zinc-600",
        dotColor: "bg-zinc-500",
      },
    ];

    // Filter out categories with 0 count unless all are 0
    const activeStats = stats.filter((s) => s.count > 0);

    const sortedBrowsers = Object.entries(browserCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const sortedOs = Object.entries(osCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      deviceStats: activeStats.length > 0 ? activeStats : stats,
      topBrowsers: sortedBrowsers,
      topOs: sortedOs,
    };
  }, [clicks]);

  return (
    <div className="rounded-xl border border-line-subtle bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] p-5 sm:p-6 w-full flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Devices
            </h3>
          </div>
        </div>

        {hasData && (
          <span className="text-xs font-mono text-zinc-400 bg-surface px-2.5 py-1 rounded-md border border-line-subtle">
            {totalClicks > clicks.length
              ? `${clicks.length} of ${totalClicks} clicks`
              : `${clicks.length} ${clicks.length === 1 ? "sample" : "samples"}`}
          </span>
        )}
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-2.5 rounded-xl bg-surface/30 border border-line-subtle">
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
            <Laptop className="h-5 w-5 text-zinc-500" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-zinc-300">
              No device data yet
            </p>
            <p className="text-[11px] text-zinc-500 max-w-xs">
              Device and browser breakdowns will show up here once this link gets clicks.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Composite Stacked Bar */}
          <div
            className="w-full bg-surface/80 rounded-full h-2.5 flex overflow-hidden p-0.5 border border-line-subtle"
            role="progressbar"
            aria-label="Device distribution meter"
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {deviceStats.map((item) => {
              if (item.percentage <= 0) return null;
              return (
                <div
                  key={item.category}
                  className={`${item.barColor} h-full first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.label}: ${item.percentage}% (${item.count} clicks)`}
                />
              );
            })}
          </div>

          {/* Individual Category Rows */}
          <div className="space-y-2.5">
            {deviceStats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.category}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-surface/40 border border-line-subtle"
                >
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-md bg-white/5 ${item.colorClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-mono text-zinc-200 font-medium">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-zinc-100 font-semibold tabular-nums">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-zinc-400 text-[11px] tabular-nums bg-white/5 px-1.5 py-0.5 rounded">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top Browsers & OS Chips */}
          <div className="pt-2 border-t border-line-subtle space-y-2">
            {topBrowsers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider mr-1">
                  Browsers:
                </span>
                {topBrowsers.map((b) => (
                  <span
                    key={b.name}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300 bg-surface px-2 py-0.5 rounded border border-line-subtle"
                  >
                    <span>{b.name}</span>
                    <span className="text-zinc-400 text-[10px] tabular-nums">
                      ({b.count})
                    </span>
                  </span>
                ))}
              </div>
            )}

            {topOs.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider mr-1">
                  OS:
                </span>
                {topOs.map((o) => (
                  <span
                    key={o.name}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300 bg-surface px-2 py-0.5 rounded border border-line-subtle"
                  >
                    <span>{o.name}</span>
                    <span className="text-zinc-400 text-[10px] tabular-nums">
                      ({o.count})
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
