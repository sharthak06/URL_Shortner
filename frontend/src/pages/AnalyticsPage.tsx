import React, { useState, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { urlsApi } from "@/api/urls.api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cardEntranceVariants } from "@/lib/motion";
import { formatCount } from "@/lib/utils";
import { getShortUrl, getShortUrlDisplay } from "@/lib/urlUtils";
import { classifyDevice, getCountryName } from "@/lib/analyticsUtils";
import { useAuth } from "@/context/AuthContext";
import { ClickTimelineChart } from "@/components/analytics/ClickTimelineChart";
import { GeographicBreakdown } from "@/components/analytics/GeographicBreakdown";
import { DeviceBreakdown } from "@/components/analytics/DeviceBreakdown";
import { RecentClicksStream } from "@/components/analytics/RecentClicksStream";

// Backend max (getLinkAnalyticsQuerySchema). Links with more clicks than this are
// charted from their most recent CLICK_SAMPLE_LIMIT events.
const CLICK_SAMPLE_LIMIT = 100;

// Airy stat tiles: no box, no border, no bg — whitespace separates them.
// min-h + justify-between keeps the four numbers baseline-aligned across the row.
const TILE =
  "relative flex min-h-[104px] flex-col justify-between gap-2";

// Matches the breakdown/stream card frame so skeletons occupy the real footprint.
const CARD_SKELETON =
  "rounded-xl border border-line-subtle bg-card p-5 sm:p-6 w-full space-y-4 animate-pulse";

export const AnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  // 15-second background polling so the analytics stay up to date
  const {
    data: analytics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["url-analytics", id, { limit: CLICK_SAMPLE_LIMIT }],
    queryFn: () => urlsApi.getUrlAnalytics(id!, { limit: CLICK_SAMPLE_LIMIT }),
    enabled: !!id,
    refetchInterval: 15000,
    // Keep the last payload on screen during the 15s background poll so the sections
    // don't remount into empty states and layout-shift back on every refetch.
    placeholderData: keepPreviousData,
  });

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fullShortUrl = getShortUrl(id!);
  const displayShortCode = getShortUrlDisplay(id!);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShortUrl);
      setCopied(true);
      toast.success("Shortlink copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const primaryDevice = useMemo(() => {
    if (!analytics?.clicks?.items?.length) return "—";
    const counts: Record<string, number> = {};
    for (const click of analytics.clicks.items) {
      const dev = classifyDevice(click.device, click.userAgent);
      counts[dev] = (counts[dev] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : "Desktop";
  }, [analytics]);

  const topCountry = analytics?.topCountries?.[0];
  const topReferrer = analytics?.topReferrers?.[0];

  // While the auth session loads from GET /auth/me, show a clean skeleton loader
  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to home page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-start px-4 py-8 sm:py-10 max-w-5xl mx-auto w-full space-y-6">
      {/* Top navigation + live status */}
      <div className="w-full flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Updating live
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
            aria-label="Refresh analytics"
            title="Refresh analytics"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Link identity header */}
      <motion.div
        variants={cardEntranceVariants}
        initial="hidden"
        animate="visible"
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-lg font-bold font-mono text-indigo-400">
              {displayShortCode}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <a
              href={fullShortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface border border-line text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <span>Visit Link</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="h-8 gap-1.5 text-xs"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${TILE} animate-pulse`}>
              <div className="h-3 w-16 bg-white/5 rounded" />
              <div className="h-8 w-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-500/20 bg-card p-6 text-center space-y-3 w-full">
          <p className="text-xs text-red-400">
            Couldn't load analytics. Try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs border-red-500/30 text-red-300 gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </Button>
        </div>
      ) : (
        /* 4 Bento KPI Metric Cards */
        <motion.div
          variants={cardEntranceVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full"
        >
          {/* Card 1: Total Clicks */}
          <div className={TILE}>
            <span className="text-xs font-medium text-zinc-400">Total clicks</span>
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100">
              {formatCount(analytics?.totalClicks ?? 0)}
            </span>
          </div>

          {/* Card 2: Top Country */}
          <div className={TILE}>
            <span className="text-xs font-medium text-zinc-400">Top country</span>
            <span className="text-xl sm:text-2xl font-bold font-mono truncate text-zinc-100 block">
              {topCountry ? getCountryName(topCountry.country) : "—"}
            </span>
          </div>

          {/* Card 3: Top Referrer */}
          <div className={TILE}>
            <span className="text-xs font-medium text-zinc-400">Top referrer</span>
            <span
              className="text-lg sm:text-xl font-bold font-mono truncate text-zinc-100 block max-w-full"
              title={topReferrer?.referrer || undefined}
            >
              {topReferrer ? topReferrer.referrer : "Direct"}
            </span>
          </div>

          {/* Card 4: Primary Device */}
          <div className={TILE}>
            <span className="text-xs font-medium text-zinc-400">Primary device</span>
            <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 block">
              {primaryDevice}
            </span>
          </div>
        </motion.div>
      )}

      {/* Chart, breakdowns and clicks stream: skeletons on cold load so the sections
          never flash their "no data yet" empty states before the request resolves.
          Hidden entirely on error — the KPI block above already shows the retry card. */}
      {isLoading ? (
        <div className="w-full space-y-6">
          <div className={CARD_SKELETON}>
            <div className="h-4 w-32 bg-white/5 rounded" />
            <div className="h-[200px] w-full bg-white/5 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className={CARD_SKELETON}>
                <div className="h-4 w-28 bg-white/5 rounded" />
                {Array.from({ length: 4 }).map((_, r) => (
                  <div key={r} className="h-6 w-full bg-white/5 rounded" />
                ))}
              </div>
            ))}
          </div>
          <div className={CARD_SKELETON}>
            <div className="h-4 w-36 bg-white/5 rounded" />
            {Array.from({ length: 5 }).map((_, r) => (
              <div key={r} className="h-8 w-full bg-white/5 rounded" />
            ))}
          </div>
        </div>
      ) : isError ? null : (
        <>
          {/* SVG Spline Velocity Chart */}
          <motion.div
            variants={cardEntranceVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <ClickTimelineChart
              clicks={analytics?.clicks?.items ?? []}
              totalClicks={analytics?.totalClicks ?? 0}
            />
          </motion.div>

          {/* Granular Breakdowns Grid */}
          <motion.div
            variants={cardEntranceVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
          >
            <GeographicBreakdown
              topCountries={analytics?.topCountries ?? []}
              totalClicks={analytics?.totalClicks ?? 0}
            />
            <DeviceBreakdown
              clicks={analytics?.clicks?.items ?? []}
              totalClicks={analytics?.totalClicks ?? 0}
            />
          </motion.div>

          {/* Real-Time Recent Clicks Audit Stream */}
          <motion.div
            variants={cardEntranceVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <RecentClicksStream
              clicks={analytics?.clicks?.items ?? []}
              totalClicks={analytics?.totalClicks ?? 0}
            />
          </motion.div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
