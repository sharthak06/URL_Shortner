import React from "react";

/**
 * RouteLoadingFallback provides a zero-CLS, sleek terminal skeleton while
 * dynamic route bundles are asynchronously fetched via React.lazy().
 */
export const RouteLoadingFallback: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
      className="flex flex-1 flex-col items-center justify-center p-8 min-h-[60vh]"
    >
      <div className="flex items-center gap-3 rounded-full border border-line bg-[#161618] px-4 py-2 shadow-lg backdrop-blur-sm">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-xs text-zinc-300 tracking-wide">
          [ ⏳ Loading module... ]
        </span>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
