import React from "react";
import type { ClickItem } from "@/types/url.types";
import {
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  Server,
  Activity,
  ShieldCheck,
  Compass,
} from "lucide-react";
import {
  getCountryFlag,
  maskIpAddress,
  normalizeReferrer,
  formatRelativeTime,
  classifyDevice,
  resolveBrowserName,
  resolveOsName,
} from "@/lib/analyticsUtils";

interface RecentClicksStreamProps {
  clicks: ClickItem[];
  totalClicks: number;
}

export const RecentClicksStream: React.FC<RecentClicksStreamProps> = ({ clicks, totalClicks }) => {
  const hasClicks = clicks && clicks.length > 0;
  const isSampled = totalClicks > clicks.length;

  const getDeviceIcon = (click: ClickItem) => {
    const category = classifyDevice(click.device, click.userAgent);
    switch (category) {
      case "Mobile":
        return <Smartphone className="h-3.5 w-3.5 text-indigo-300" />;
      case "Tablet":
        return <Tablet className="h-3.5 w-3.5 text-zinc-400" />;
      case "Desktop":
        return <Laptop className="h-3.5 w-3.5 text-indigo-400" />;
      default:
        return <Server className="h-3.5 w-3.5 text-zinc-500" />;
    }
  };

  return (
    <div className="rounded-xl border border-line-subtle bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] p-5 sm:p-6 w-full space-y-4">
      {/* Stream Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Recent clicks
            </h3>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono">
            Most recent visits to this link
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-line-subtle text-xs font-mono text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />
            <span>IP addresses are masked</span>
          </div>

          {hasClicks && (
            <span className="text-xs font-mono text-zinc-300 bg-surface px-2.5 py-1 rounded-md border border-line-subtle">
              {isSampled
                ? `${clicks.length} of ${totalClicks.toLocaleString()} events`
                : `${clicks.length} ${clicks.length === 1 ? "event" : "events"}`}
            </span>
          )}
        </div>
      </div>

      {/* Stream Table or Empty State */}
      {!hasClicks ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5 rounded-xl bg-surface/30 border border-line-subtle">
          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
            <Clock className="h-5 w-5 text-zinc-500" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-zinc-300">
              No clicks yet
            </p>
            <p className="text-[11px] text-zinc-500 max-w-sm">
              Clicks on this link will show up here as they happen.
            </p>
          </div>
        </div>
      ) : (
        // Up to 100 rows: scroll inside a fixed-height box (~10 rows visible) with a sticky header
        <div className="max-h-[440px] overflow-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-line-subtle text-left text-xs font-mono">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="text-zinc-500 border-b border-line-subtle">
                  <th scope="col" className="py-2.5 px-3 font-medium">
                    Timestamp
                  </th>
                  <th scope="col" className="py-2.5 px-3 font-medium">
                    Location
                  </th>
                  <th scope="col" className="py-2.5 px-3 font-medium">
                    Device
                  </th>
                  <th scope="col" className="py-2.5 px-3 font-medium">
                    Referrer
                  </th>
                  <th scope="col" className="py-2.5 px-3 font-medium text-right">
                    IP address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {clicks.map((click) => {
                  const relativeTime = formatRelativeTime(click.clickedAt);
                  const fullDate = new Date(click.clickedAt).toLocaleString();
                  const countryCode = click.country || "—";
                  const flag = getCountryFlag(click.country);
                  const city = click.city ? click.city : null;
                  const referrerMeta = normalizeReferrer(click.referrer);
                  const browser = resolveBrowserName(click.browser, click.userAgent);
                  const os = resolveOsName(click.os, click.userAgent);
                  const maskedIp = maskIpAddress(click.ipAddress);

                  return (
                    <tr
                      key={click.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-3 whitespace-nowrap text-zinc-300">
                        <span
                          title={fullDate}
                          className="cursor-help border-b border-dotted border-zinc-600 hover:border-zinc-400"
                        >
                          {relativeTime}
                        </span>
                      </td>

                      {/* Geolocation */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-sm select-none"
                            role="img"
                            aria-label={`${countryCode} flag`}
                          >
                            {flag}
                          </span>
                          <span className="text-zinc-200 font-semibold">
                            {countryCode}
                          </span>
                          {city && (
                            <span className="text-zinc-400 text-[11px] truncate max-w-[120px]">
                              · {city}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Device & Client */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-white/5 shrink-0">
                            {getDeviceIcon(click)}
                          </span>
                          <div className="flex flex-col text-[11px] leading-tight">
                            <span className="text-zinc-200">{browser}</span>
                            <span className="text-zinc-500">{os}</span>
                          </div>
                        </div>
                      </td>

                      {/* Referrer */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${
                            referrerMeta.isDirect
                              ? "bg-surface text-zinc-400 border-line-subtle"
                              : "bg-indigo-950/30 text-indigo-300 border-indigo-500/20"
                          }`}
                        >
                          {!referrerMeta.isDirect && (
                            <Compass className="h-3 w-3 text-indigo-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[140px]" title={click.referrer || "Direct"}>
                            {referrerMeta.name}
                          </span>
                        </span>
                      </td>

                      {/* Anonymized IP */}
                      <td className="py-3 px-3 whitespace-nowrap text-right text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-surface/60 border border-line-subtle text-[11px] text-zinc-400">
                          {maskedIp}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
