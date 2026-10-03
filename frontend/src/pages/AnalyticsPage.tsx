import React, { useState, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { urlsApi } from "@/api/urls.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Flame,
  Globe,
  Compass,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cardEntranceVariants } from "@/lib/motion";
import { getShortUrl, getShortUrlDisplay } from "@/lib/urlUtils";
import { classifyDevice } from "@/lib/analyticsUtils";
import { useAuth } from "@/context/AuthContext";
import { ClickTimelineChart } from "@/components/analytics/ClickTimelineChart";
import { GeographicBreakdown } from "@/components/analytics/GeographicBreakdown";
import { DeviceBreakdown } from "@/components/analytics/DeviceBreakdown";
import { RecentClicksStream } from "@/components/analytics/RecentClicksStream";

// Backend max (getLinkAnalyticsQuerySchema). Links with more clicks than this are
// charted from their most recent CLICK_SAMPLE_LIMIT events.
const CLICK_SAMPLE_LIMIT = 100;

const TILE =
  "relative flex min-h-[104px] flex-col justify-between gap-3 rounded-xl border border-line-subtle bg-card p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

export const AnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  // 15-second background polling interval for real-time telemetry updates
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

  // If session is still hydrating from GET /auth/me, display clean skeleton loader
  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
          <span>Hydrating session...</span>
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
      {/* Top Navigation & Telemetry State Header */}
      <div className="w-full flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500">Updates automatically</span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
            title="Refresh analytics"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Link Identity Banner */}
      <motion.div
        variants={cardEntranceVariants}
        initial="hidden"
        animate="visible"
        className="w-full rounded-xl border border-line-subtle bg-card px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-8 sm:py-8 space-y-3"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-indigo-300/80">// Analytics</p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-mono text-indigo-400">
                {displayShortCode}
              </span>
              <Badge variant="brand" className="text-[10px] font-mono">
                Live URL
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Identifier: <span className="text-zinc-300">{id}</span>
            </p>
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
          <p className="text-xs text-red-400 font-mono">
            Failed to load analytics telemetry for this link.
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
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Total clicks</span>
              <Flame className="h-4 w-4 text-zinc-500" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-zinc-100">
                {analytics?.totalClicks ?? 0}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">All-time telemetry</span>
          </div>

          {/* Card 2: Top Country */}
          <div className={TILE}>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Top country</span>
              <Globe className="h-4 w-4 text-zinc-500" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold font-mono truncate text-zinc-100 block">
                {topCountry ? topCountry.country : "—"}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {topCountry ? `${topCountry.clicks} clicks` : "No geo data yet"}
            </span>
          </div>

          {/* Card 3: Top Referrer */}
          <div className={TILE}>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Top referrer</span>
              <Compass className="h-4 w-4 text-zinc-500" />
            </div>
            <div>
              <span
                className="text-lg sm:text-xl font-bold font-mono truncate text-zinc-100 block max-w-full"
                title={topReferrer?.referrer || undefined}
              >
                {topReferrer ? topReferrer.referrer : "Direct"}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {topReferrer ? `${topReferrer.clicks} clicks` : "Direct navigation"}
            </span>
          </div>

          {/* Card 4: Primary Device */}
          <div className={TILE}>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium">Primary device</span>
              <Smartphone className="h-4 w-4 text-zinc-500" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 block">
                {primaryDevice}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {(analytics?.totalClicks ?? 0) > (analytics?.clicks?.items?.length ?? 0)
                ? `Latest ${analytics?.clicks?.items?.length ?? 0} clicks`
                : "User-agent classification"}
            </span>
          </div>
        </motion.div>
      )}

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
    </div>
  );
};

export default AnalyticsPage;
