import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Link2, MousePointerClick, Trophy } from "lucide-react";
import { useUrlStats } from "@/hooks/useUrls";
import { getShortUrlDisplay } from "@/lib/urlUtils";
import { listContainerVariants, sectionRevealVariants } from "@/lib/motion";
import { cn, formatCount } from "@/lib/utils";

const TILE =
  "relative flex min-h-[104px] flex-col justify-between gap-3 rounded-xl border border-line-subtle bg-card p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

interface TileLabelProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

const TileLabel: React.FC<TileLabelProps> = ({ icon, children }) => (
  <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 [&_svg]:h-3.5 [&_svg]:w-3.5">
    {icon}
    <span>{children}</span>
  </div>
);

const ValueSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("h-7 animate-pulse rounded-md bg-white/5", className)} />
);

export const StatsStrip: React.FC = () => {
  const { data: stats, isLoading, isError } = useUrlStats();

  // On error, keep the layout and show a dash rather than an alarming banner
  const renderCount = (value: number | undefined) =>
    isLoading ? (
      <ValueSkeleton className="w-16" />
    ) : (
      <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-zinc-100">
        {isError || value === undefined ? "—" : formatCount(value)}
      </p>
    );

  const topLink = stats?.topLink ?? null;

  return (
    <motion.section
      aria-label="Your link stats"
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <motion.div variants={sectionRevealVariants} className={TILE}>
        <TileLabel icon={<Link2 aria-hidden="true" />}>Links</TileLabel>
        {renderCount(stats?.totalLinks)}
      </motion.div>

      <motion.div variants={sectionRevealVariants} className={TILE}>
        <TileLabel icon={<MousePointerClick aria-hidden="true" />}>Total clicks</TileLabel>
        {renderCount(stats?.totalClicks)}
      </motion.div>

      {/* Full width on phones: a short link needs the room more than a number does */}
      <motion.div variants={sectionRevealVariants} className="col-span-2 sm:col-span-1">
        {topLink ? (
          <Link
            to={`/analytics/${topLink.shortCode}`}
            className={cn(
              TILE,
              "group h-full transition-[border-color,background-color] duration-200 hover:border-line hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            )}
          >
            <div className="flex items-center justify-between">
              <TileLabel icon={<Trophy aria-hidden="true" />}>Top link</TileLabel>
              <ArrowUpRight
                className="h-3.5 w-3.5 text-zinc-600 transition-[color,transform] duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-zinc-300"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-medium text-indigo-400" title={getShortUrlDisplay(topLink.shortCode)}>
                {getShortUrlDisplay(topLink.shortCode)}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                <span className="font-mono tabular-nums text-zinc-300">{formatCount(topLink.clickCount)}</span>{" "}
                {topLink.clickCount === 1 ? "click" : "clicks"}
              </p>
            </div>
          </Link>
        ) : (
          <div className={cn(TILE, "h-full")}>
            <TileLabel icon={<Trophy aria-hidden="true" />}>Top link</TileLabel>
            {isLoading ? (
              <ValueSkeleton className="w-full max-w-[180px]" />
            ) : (
              <p className="text-[13px] leading-snug text-zinc-500">
                {isError ? "—" : "No clicks yet. Share a link and your most popular one shows up here."}
              </p>
            )}
          </div>
        )}
      </motion.div>
    </motion.section>
  );
};
