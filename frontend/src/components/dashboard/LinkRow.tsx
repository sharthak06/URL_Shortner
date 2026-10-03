import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { ShortURL } from "@/types/url.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDomainFaviconUrl, getShortUrl, getShortUrlDisplay } from "@/lib/urlUtils";
import { formatRelativeTime } from "@/lib/dateUtils";
import { cardEntranceVariants } from "@/lib/motion";
import { cn, formatCount } from "@/lib/utils";
import { Copy, Check, QrCode, MoreHorizontal, Pencil, Trash2, Globe, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface LinkRowProps {
  url: ShortURL;
  onOpenQr: (url: ShortURL) => void;
  onEdit: (url: ShortURL) => void;
  onDelete: (url: ShortURL) => void;
}

// Splits a destination into a host that never truncates and a path that does
function splitDestination(originalUrl: string): { host: string; rest: string } {
  try {
    const parsed = new URL(originalUrl);
    const host = parsed.hostname.replace(/^www\./, "");
    const rest = `${parsed.pathname === "/" ? "" : parsed.pathname}${parsed.search}${parsed.hash}`;
    return { host, rest };
  } catch {
    return { host: originalUrl, rest: "" };
  }
}

// Row actions: always visible on touch screens; on hover-capable screens they appear on
// row hover/focus, and stay while the ⋯ menu is open.
const ACTIONS_REVEAL =
  "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100 has-[[data-state=open]]:!opacity-100 transition-opacity duration-150";

const ICON_BUTTON = "h-9 w-9 text-zinc-400 hover:text-zinc-100 sm:h-8 sm:w-8";

/** Shared column layout for a link row: short-link, destination, clicks, created, actions. */
export const LINK_ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1.3fr)_6.5rem_auto] md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.3fr)_6.5rem_5rem_auto] items-center gap-x-4 sm:gap-x-6";

export const LinkRow: React.FC<LinkRowProps> = ({ url, onOpenQr, onEdit, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const navigate = useNavigate();

  const shortUrlDisplay = getShortUrlDisplay(url.shortCode);
  const faviconUrl = getDomainFaviconUrl(url.originalUrl);
  const { host, rest } = splitDestination(url.originalUrl);
  const analyticsPath = `/analytics/${url.shortCode}`;
  const createdLabel = formatRelativeTime(url.createdAt);
  const createdTitle = new Date(url.createdAt).toLocaleString();
  const hasClicks = url.clickCount > 0;
  const clicksLabel = `${formatCount(url.clickCount)} ${url.clickCount === 1 ? "click" : "clicks"}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShortUrl(url.shortCode));
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <motion.li
      variants={cardEntranceVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout="position"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(analyticsPath)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(analyticsPath);
          }
        }}
        aria-label={`View analytics for ${shortUrlDisplay}`}
        className={cn(
          LINK_ROW_GRID,
          "group relative cursor-pointer px-3 py-3 transition-colors duration-150 hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400/60 sm:px-4"
        )}
      >
        {/* Short link column: favicon + short link/destination stack */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Favicon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line-subtle bg-surface">
            {!faviconError && faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="h-4 w-4 object-contain"
                loading="lazy"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <Globe className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
            )}
          </div>

          {/* Short link (primary) + destination (secondary, mobile only) */}
          <div className="min-w-0 flex-1">
            <span className="block w-fit max-w-full truncate font-mono text-sm font-medium text-indigo-400">
              {shortUrlDisplay}
            </span>
            <a
              href={url.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={url.originalUrl}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="mt-0.5 flex min-w-0 max-w-full rounded-sm text-xs text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 sm:hidden"
            >
              <bdi dir="ltr" className="flex min-w-0">
                <span className="shrink-0 text-zinc-400">{host}</span>
                <span className="truncate">{rest}</span>
              </bdi>
            </a>
            {/* Phones: clicks and age move under the destination instead of their own columns */}
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 sm:hidden">
              <span className={cn("font-mono tabular-nums", hasClicks ? "text-zinc-300" : "text-zinc-600")}>
                {clicksLabel}
              </span>
              <span aria-hidden="true" className="text-zinc-700">·</span>
              <time dateTime={url.createdAt} title={createdTitle}>{createdLabel}</time>
            </p>
          </div>
        </div>

        {/* Destination column (tablet and up) */}
        <a
          href={url.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={url.originalUrl}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="hidden min-w-0 max-w-full rounded-sm text-xs text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 sm:flex"
        >
          <bdi dir="ltr" className="flex min-w-0">
            <span className="shrink-0 text-zinc-400">{host}</span>
            <span className="truncate">{rest}</span>
          </bdi>
        </a>

        {/* Clicks column (tablet and up) */}
        <div
          className={cn(
            "hidden items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs sm:flex",
            hasClicks ? "text-zinc-300" : "text-zinc-600"
          )}
        >
          <BarChart3 className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
          <span className="font-mono tabular-nums">{clicksLabel}</span>
        </div>

        {/* Age column (desktop) */}
        <time
          dateTime={url.createdAt}
          title={createdTitle}
          className="hidden text-right text-xs text-zinc-500 md:block"
        >
          {createdLabel}
        </time>

        {/* Actions */}
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn("flex shrink-0 items-center gap-0.5", ACTIONS_REVEAL)}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className={ICON_BUTTON}
            aria-label={copied ? "Copied" : `Copy ${shortUrlDisplay}`}
            title={copied ? "Copied" : "Copy link"}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenQr(url)}
            className={cn(ICON_BUTTON, "hidden sm:inline-flex")}
            aria-label="Show QR code"
            title="QR code"
          >
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className={ICON_BUTTON} aria-label="More actions" title="More">
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link to={analyticsPath} className="flex items-center gap-2 text-xs">
                  <BarChart3 className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                  <span>Analytics</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(url)} className="gap-2 text-xs">
                <Pencil className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                <span>Edit destination</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenQr(url)} className="gap-2 text-xs">
                <QrCode className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                <span>QR code</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(url)}
                className="gap-2 text-xs text-red-400 focus:bg-red-500/10 focus:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.li>
  );
};

/** The bordered list that holds rows. Shared with FeedSkeleton so loading → loaded doesn't shift. */
export const LINK_LIST_FRAME =
  "divide-y divide-line-subtle overflow-hidden rounded-xl border border-line-subtle bg-card shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";
