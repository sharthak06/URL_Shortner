import React from "react";
import { Globe, Radar } from "lucide-react";
import { getCountryFlag, getCountryName } from "@/lib/analyticsUtils";

interface GeographicBreakdownProps {
  topCountries: Array<{ country: string; clicks: number }>;
  totalClicks: number;
}

export const GeographicBreakdown: React.FC<GeographicBreakdownProps> = ({
  topCountries,
  totalClicks,
}) => {
  const hasData = topCountries && topCountries.length > 0;

  // Compute total clicks across top countries if totalClicks is 0 or less
  const effectiveTotal = Math.max(
    totalClicks,
    topCountries.reduce((sum, item) => sum + item.clicks, 0),
    1
  );

  return (
    <div className="rounded-xl border border-line-subtle bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] p-5 sm:p-6 w-full flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Top countries
            </h3>
          </div>
        </div>

        {hasData && (
          <span className="text-xs font-mono text-zinc-400 bg-surface px-2.5 py-1 rounded-md border border-line-subtle">
            {topCountries.length} {topCountries.length === 1 ? "region" : "regions"}
          </span>
        )}
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-2.5 rounded-xl bg-surface/30 border border-line-subtle">
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
            <Radar className="h-5 w-5 animate-pulse text-indigo-400/70" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-zinc-300">
              No geographic data yet
            </p>
            <p className="text-[11px] text-zinc-400 font-mono max-w-xs">
              Countries will show up here once this link gets clicks.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5 pt-1">
          {topCountries.map((item) => {
            const percentage = Math.min(
              100,
              Math.max(1, Math.round((item.clicks / effectiveTotal) * 100))
            );
            const flag = getCountryFlag(item.country);
            const countryName = getCountryName(item.country);

            return (
              <div key={item.country} className="space-y-1.5 group">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-base leading-none select-none"
                      role="img"
                      aria-label={`${countryName} flag`}
                    >
                      {flag}
                    </span>
                    <span className="font-mono text-zinc-200 font-medium truncate">
                      {countryName}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase px-1.5 py-0.5 rounded bg-surface border border-line-subtle">
                      {item.country}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    <span className="text-zinc-100 font-semibold tabular-nums">
                      {item.clicks.toLocaleString()}
                    </span>
                    <span className="text-zinc-400 text-[11px] tabular-nums min-w-[32px] text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  className="w-full bg-surface/80 rounded-full h-2 overflow-hidden p-0.5 border border-line-subtle"
                  role="progressbar"
                  aria-label={`${countryName}: ${percentage}% of total clicks`}
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
