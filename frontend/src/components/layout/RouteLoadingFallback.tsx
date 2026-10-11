import React from "react";

/**
 * RouteLoadingFallback provides a zero-CLS loader while dynamic route bundles
 * are asynchronously fetched via React.lazy(). Mirrors the dashboard loader.
 */
export const RouteLoadingFallback: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
      className="flex flex-1 flex-col items-center justify-center p-8 min-h-[60vh]"
    >
      <div className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 shadow-lg backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
        <span className="text-sm text-zinc-400">Loading…</span>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
