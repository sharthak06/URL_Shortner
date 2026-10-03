import React from "react";
import { Link2, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyFeedStateProps {
  type?: "zero-links" | "no-search-results";
  searchQuery?: string;
  onClearSearch?: () => void;
}

const FRAME =
  "flex flex-col items-center rounded-xl border border-line-subtle bg-card px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

const ICON_TILE =
  "mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-surface ring-1 ring-line shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

export const EmptyFeedState: React.FC<EmptyFeedStateProps> = ({
  type = "zero-links",
  searchQuery,
  onClearSearch,
}) => {
  if (type === "no-search-results") {
    return (
      <div className={FRAME}>
        <div className={ICON_TILE}>
          <SearchX className="h-[18px] w-[18px] text-zinc-400" aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-100">
          No links match &ldquo;<span className="break-all">{searchQuery}</span>&rdquo;
        </h3>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-zinc-500">
          Try part of the destination address, or the short code.
        </p>
        {onClearSearch && (
          <Button variant="secondary" size="sm" onClick={onClearSearch} className="mt-5">
            Clear search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={FRAME}>
      <div className={ICON_TILE}>
        <Link2 className="h-[18px] w-[18px] text-indigo-400" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-100">No links yet</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-zinc-500">
        Paste a long URL in the box above to create your first short link. It&apos;ll show up here
        with its clicks.
      </p>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          const input = document.getElementById("shortener-input");
          input?.scrollIntoView({ behavior: "smooth", block: "center" });
          (input as HTMLInputElement | null)?.focus();
        }}
        className="mt-5"
      >
        Create your first link
      </Button>
    </div>
  );
};
