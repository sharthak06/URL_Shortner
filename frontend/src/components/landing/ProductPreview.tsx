import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { BarChart3, Copy, Globe, MoreHorizontal, QrCode } from "lucide-react";
import { getDomainFaviconUrl, getShortUrlDisplay } from "@/lib/urlUtils";
import { cn } from "@/lib/utils";
import { LINK_ROW_GRID } from "@/components/dashboard/LinkRow";
import { listContainerVariants, sectionRevealVariants, snappyTransition } from "@/lib/motion";
import { SectionHeader } from "@/components/landing/SectionHeader";

interface SampleLink {
  code: string;
  url: string;
  clicks: number;
  created: string;
}

// Sample rows only. They mirror what the real dashboard shows (short link, destination, clicks, age, actions).
const SAMPLE_LINKS: SampleLink[] = [
  { code: "k3Vd9Qa", url: "https://github.com/vercel/next.js/releases", clicks: 1284, created: "2h ago" },
  { code: "Pz71mRt", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", clicks: 4313, created: "yesterday" },
  { code: "bN4xW2e", url: "https://www.notion.so/team/launch-checklist", clicks: 312, created: "2d ago" },
  { code: "Hq8Lc0s", url: "https://www.figma.com/design/landing-v2", clicks: 96, created: "4d ago" },
  { code: "t6YjE5u", url: "https://news.ycombinator.com/item?id=41203391", clicks: 2051, created: "1w ago" },
];

/** How often the first row picks up a new click while the preview is on screen. */
const TICK_MS = 3200;

// Mirrors LinkRow's splitDestination: a host that never truncates + a path that does.
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

const clicksLabel = (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? "click" : "clicks"}`;

// Static stand-ins for LinkRow's ghost icon buttons: borderless, ICON_BUTTON sizing, hover-revealed.
const ICON_GHOST = "flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 sm:h-8 sm:w-8";
const ACTIONS_REVEAL =
  "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-150";

const Favicon: React.FC<{ url: string }> = ({ url }) => {
  const [failed, setFailed] = useState(false);
  const src = getDomainFaviconUrl(url);
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line-subtle bg-surface">
      {!failed && src ? (
        <img src={src} alt="" loading="lazy" className="h-4 w-4 object-contain" onError={() => setFailed(true)} />
      ) : (
        <Globe className="h-3.5 w-3.5 text-zinc-500" />
      )}
    </span>
  );
};

/** A quiet, non-interactive look at the dashboard, placed right after the hero. */
export const ProductPreview: React.FC = () => {
  const frameRef = useRef<HTMLDivElement>(null);
  const inView = useInView(frameRef, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [liveClicks, setLiveClicks] = useState(SAMPLE_LINKS[0].clicks);

  // One row keeps counting, to show clicks arriving without any other movement.
  useEffect(() => {
    if (!inView || reduceMotion) return;
    const timer = window.setInterval(() => setLiveClicks((n) => n + 1), TICK_MS);
    return () => window.clearInterval(timer);
  }, [inView, reduceMotion]);

  return (
    <section id="product" aria-labelledby="preview-heading" className="w-full scroll-mt-20 px-4 pb-24 sm:pb-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
        >
          <SectionHeader
            align="center"
            eyebrow="// Your dashboard"
            titleId="preview-heading"
            title="Every link and every click, in one place."
            description="Copy, edit, get a QR code, or delete a link. Click counts update as people open them."
          />
        </motion.div>

        <motion.div
          ref={frameRef}
          variants={sectionRevealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="relative mt-12 sm:mt-14 rounded-2xl border border-line-subtle p-1.5"
        >
          <p className="sr-only">Example of the link list in your dashboard, with sample data.</p>

          <div aria-hidden="true" className="overflow-hidden rounded-xl border border-line-subtle bg-card">
            {/* Window bar */}
            <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-zinc-200">Your links</span>
                <span className="font-mono text-[11px] text-zinc-400">{SAMPLE_LINKS.length}</span>
              </div>
              <span className="rounded border border-line px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                Example
              </span>
            </div>

            {/* Column headings (match LinkFeed's own breakpoints) */}
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

            {/* Rows */}
            <motion.ul
              variants={listContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="divide-y divide-line-subtle"
            >
              {SAMPLE_LINKS.map((link, i) => {
                const clicks = i === 0 ? liveClicks : link.clicks;
                const dest = splitDestination(link.url);
                return (
                  <motion.li
                    key={link.code}
                    variants={sectionRevealVariants}
                    className={cn(LINK_ROW_GRID, "group relative px-3 py-3.5 sm:px-4")}
                  >
                    {/* Short link column: favicon + short link/destination stack */}
                    <div className="flex min-w-0 items-center gap-3">
                      <Favicon url={link.url} />
                      <div className="min-w-0 flex-1">
                        <span className="block w-fit max-w-full truncate font-mono text-sm font-medium text-indigo-400">
                          {getShortUrlDisplay(link.code)}
                        </span>
                        {/* Phones: destination under the short link */}
                        <span className="mt-0.5 flex min-w-0 max-w-full text-xs text-zinc-500 sm:hidden">
                          <bdi dir="ltr" className="flex min-w-0">
                            <span className="shrink-0 text-zinc-400">{dest.host}</span>
                            <span className="truncate">{dest.rest}</span>
                          </bdi>
                        </span>
                        {/* Phones: clicks and age move under the destination */}
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 sm:hidden">
                          <span className="font-mono tabular-nums text-zinc-300">{clicksLabel(clicks)}</span>
                          <span aria-hidden="true" className="text-zinc-700">·</span>
                          <span>{link.created}</span>
                        </p>
                      </div>
                    </div>

                    {/* Destination column (tablet and up) */}
                    <span className="hidden min-w-0 max-w-full text-xs text-zinc-500 sm:flex">
                      <bdi dir="ltr" className="flex min-w-0">
                        <span className="shrink-0 text-zinc-400">{dest.host}</span>
                        <span className="truncate">{dest.rest}</span>
                      </bdi>
                    </span>

                    {/* Clicks column (tablet and up) */}
                    <div className="hidden items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs text-zinc-300 sm:flex">
                      {i === 0 && !reduceMotion && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        </span>
                      )}
                      <BarChart3 className="h-3.5 w-3.5 opacity-70" />
                      <span className="relative inline-flex overflow-hidden font-mono tabular-nums">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={clicks}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={snappyTransition}
                          >
                            {clicksLabel(clicks)}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </div>

                    {/* Age column (desktop) */}
                    <span className="hidden text-right text-xs text-zinc-500 md:block">{link.created}</span>

                    {/* Actions: borderless ghost icons, revealed on row hover */}
                    <div className={cn("hidden shrink-0 items-center gap-0.5 sm:flex", ACTIONS_REVEAL)}>
                      <span className={ICON_GHOST}>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className={ICON_GHOST}>
                        <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className={ICON_GHOST}>
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>

          {/* Fade the last rows into the page */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 rounded-b-2xl bg-gradient-to-b from-transparent to-canvas"
          />
        </motion.div>
      </div>
    </section>
  );
};
