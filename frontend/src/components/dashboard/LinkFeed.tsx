import React, { useState, useEffect } from "react";
import { useUserUrls } from "@/hooks/useUrls";
import { AnimatePresence } from "framer-motion";
import { LinkRow, LINK_LIST_FRAME, LINK_ROW_GRID } from "./LinkRow";
import { FeedSkeleton } from "./FeedSkeleton";
import { EmptyFeedState } from "./EmptyFeedState";
import { QrCodeModal } from "@/components/modals/QrCodeModal";
import { EditUrlModal } from "@/components/modals/EditUrlModal";
import { DeleteLinkDialog } from "@/components/modals/DeleteLinkDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { getShortUrl } from "@/lib/urlUtils";
import { cn } from "@/lib/utils";
import type { ShortURL } from "@/types/url.types";

// People often paste a whole short link ("localhost:3000/r/abc123") into search;
// the server matches on the code, so search for just that part.
function normalizeSearch(raw: string): string {
  const trimmed = raw.trim();
  const shortLinkMatch = trimmed.match(/\/r\/([^/?#\s]+)\/?$/);
  return shortLinkMatch ? shortLinkMatch[1] : trimmed;
}

interface LinkFeedProps {
  onEditUrl?: (url: ShortURL) => void;
  onDeleteUrl?: (url: ShortURL) => void;
}

export const LinkFeed: React.FC<LinkFeedProps> = ({
  onEditUrl,
  onDeleteUrl,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [qrModalUrl, setQrModalUrl] = useState<ShortURL | null>(null);
  const [editModalUrl, setEditModalUrl] = useState<ShortURL | null>(null);
  const [deleteDialogUrl, setDeleteDialogUrl] = useState<ShortURL | null>(null);

  // 300ms Debounce for server search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(normalizeSearch(searchInput));
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const {
    data,
    links,
    isLoading,
    isFetching,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useUserUrls({ search: debouncedSearch, limit: 10 });

  // Background refetches (search, refresh) — not the first load or "Load more"
  const isRefreshing = isFetching && !isLoading && !isFetchingNextPage;
  const pagesLoaded = data?.pages.length ?? 0;

  return (
    <section aria-labelledby="links-heading" className="w-full space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="links-heading" className="font-display text-base font-semibold tracking-tight text-zinc-100">
          Your links
        </h2>

        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            {isRefreshing && searchInput ? (
              <Loader2
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-500"
                aria-hidden="true"
              />
            ) : (
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
            )}
            <Input
              type="search"
              placeholder="Search links"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchInput("");
              }}
              className="h-9 border-line-subtle bg-surface/60 pl-9 pr-9 text-[13px] placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
              aria-label="Search links by destination or short code"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-r-lg text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400/60"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9 shrink-0 text-zinc-400 hover:text-zinc-100 disabled:opacity-100"
            aria-label="Refresh links"
            title="Refresh"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && !searchInput && "animate-spin")} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <FeedSkeleton count={4} />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line-subtle bg-card px-6 py-10 text-center">
          <p className="text-sm text-zinc-300">Couldn&apos;t load your links.</p>
          <p className="text-xs text-zinc-500">Check your connection and try again.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-1 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Try again</span>
          </Button>
        </div>
      ) : links.length === 0 ? (
        debouncedSearch ? (
          <EmptyFeedState
            type="no-search-results"
            searchQuery={debouncedSearch}
            onClearSearch={() => setSearchInput("")}
          />
        ) : (
          <EmptyFeedState type="zero-links" />
        )
      ) : (
        <div className="space-y-4">
          <div className={cn(LINK_LIST_FRAME, "transition-opacity duration-200", isRefreshing && searchInput && "opacity-60")}>
            {/* Column headings (tablet and up columns match LinkRow's own breakpoints) */}
            <div
              className={cn(
                LINK_ROW_GRID,
                "border-b border-line-subtle px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 sm:px-4"
              )}
            >
              <span>Short link</span>
              <span className="hidden sm:block">Destination</span>
              <span className="hidden sm:block">Clicks</span>
              <span className="hidden md:block">Created</span>
              <span className="hidden w-[6.25rem] sm:block" />
            </div>

            <ul className="divide-y divide-line-subtle" aria-label="Your links" aria-busy={isRefreshing}>
              <AnimatePresence initial={false}>
                {links.map((link) => (
                  <LinkRow
                    key={link.id}
                    url={link}
                    onOpenQr={(url) => setQrModalUrl(url)}
                    onEdit={(url) => {
                      setEditModalUrl(url);
                      onEditUrl?.(url);
                    }}
                    onDelete={(url) => {
                      setDeleteDialogUrl(url);
                      onDeleteUrl?.(url);
                    }}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </div>

          {/* Keyset pagination */}
          {hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="h-9 gap-1.5 px-4"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Loading…</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Load more</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Only worth saying after the user has actually paged through
            pagesLoaded > 1 && (
              <p className="text-center text-xs text-zinc-600">That&apos;s everything.</p>
            )
          )}
        </div>
      )}

      {/* QR Code Modal for Selected Link */}
      {qrModalUrl && (
        <QrCodeModal
          isOpen={!!qrModalUrl}
          onClose={() => setQrModalUrl(null)}
          shortUrl={getShortUrl(qrModalUrl.shortCode)}
          originalUrl={qrModalUrl.originalUrl}
        />
      )}

      {/* Edit Destination URL Modal */}
      <EditUrlModal
        isOpen={!!editModalUrl}
        onClose={() => setEditModalUrl(null)}
        url={editModalUrl}
      />

      {/* Delete Link Permanent Confirmation Dialog */}
      <DeleteLinkDialog
        isOpen={!!deleteDialogUrl}
        onClose={() => setDeleteDialogUrl(null)}
        url={deleteDialogUrl}
      />
    </section>
  );
};
