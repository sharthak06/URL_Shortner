import React from "react";
import { LINK_LIST_FRAME, LINK_ROW_GRID } from "./LinkRow";
import { cn } from "@/lib/utils";

interface FeedSkeletonProps {
  count?: number;
}

// Mirrors LinkRow's grid columns (favicon+link · destination · clicks · age · actions) so nothing jumps on load
export const FeedSkeleton: React.FC<FeedSkeletonProps> = ({ count = 3 }) => {
  return (
    <div role="status">
      <span className="sr-only">Loading links…</span>
      <ul className={LINK_LIST_FRAME} aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <li key={idx} className={cn(LINK_ROW_GRID, "animate-pulse px-3 py-3 sm:px-4")}>
          {/* Short link column: favicon + text placeholder */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-white/5" />
            <div className="h-3.5 w-40 max-w-full rounded bg-white/[0.07]" />
          </div>

          {/* Destination column (tablet and up) */}
          <div className="hidden h-3 w-2/3 rounded bg-white/5 sm:block" />

          {/* Clicks column (tablet and up) */}
          <div className="hidden h-3.5 w-14 rounded bg-white/5 sm:block" />

          {/* Created column (desktop) */}
          <div className="hidden h-3 w-10 rounded bg-white/5 md:block" />

          {/* Actions column */}
          <div className="flex items-center gap-1.5">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-white/5" />
            <div className="hidden h-8 w-8 shrink-0 rounded-lg bg-white/5 sm:block" />
          </div>
        </li>
      ))}
      </ul>
    </div>
  );
};
