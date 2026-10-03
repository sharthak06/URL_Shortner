import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Copy, Globe, Pencil, QrCode, Trash2 } from "lucide-react";
import { getDomainFaviconUrl } from "@/lib/urlUtils";
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

const hostnameOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const Favicon: React.FC<{ url: string }> = ({ url }) => {
  const [failed, setFailed] = useState(false);
  const src = getDomainFaviconUrl(url);
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
      {!failed && src ? (
        <img src={src} alt="" loading="lazy" className="h-4 w-4 object-contain" onError={() => setFailed(true)} />
      ) : (
        <Globe className="h-3.5 w-3.5 text-zinc-500" />
      )}
    </span>
  );
};

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_5rem_5.5rem_auto] items-center gap-x-6";

/** A quiet, non-interactive look at the dashboard, placed right after the hero. */
export const ProductPreview: React.FC = () => {
  const host = typeof window !== "undefined" ? window.location.host : "shortr.app";
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

            {/* Column headings */}
            <div
              className={`${ROW_GRID} border-b border-line-subtle px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 sm:px-5`}
            >
              <span>Short link</span>
              <span className="hidden sm:block">Destination</span>
              <span className="text-right sm:text-left">Clicks</span>
              <span className="hidden sm:block">Created</span>
              <span className="hidden sm:block w-[7.75rem]" />
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
                return (
                  <motion.li
                    key={link.code}
                    variants={sectionRevealVariants}
                    className={`${ROW_GRID} px-4 py-3 sm:px-5`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Favicon url={link.url} />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[13px] font-medium text-indigo-300">
                          {host}/r/{link.code}
                        </p>
                        <p className="truncate font-mono text-[11px] text-zinc-400 sm:hidden">
                          {hostnameOf(link.url)}
                        </p>
                      </div>
                    </div>

                    <p className="hidden min-w-0 truncate font-mono text-xs text-zinc-400 sm:block">
                      {link.url.replace(/^https?:\/\/(www\.)?/, "")}
                    </p>

                    <div className="flex items-center justify-end gap-1.5 sm:justify-start">
                      {i === 0 && !reduceMotion && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        </span>
                      )}
                      <span className="relative inline-flex overflow-hidden font-mono text-[13px] tabular-nums text-zinc-200">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={clicks}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={snappyTransition}
                          >
                            {clicks.toLocaleString("en-US")}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </div>

                    <p className="hidden font-mono text-xs text-zinc-500 sm:block">{link.created}</p>

                    <div className="hidden items-center gap-1 text-zinc-500 sm:flex">
                      {[Copy, QrCode, Pencil, Trash2].map((Icon, j) => (
                        <span
                          key={j}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-line-subtle bg-surface/60"
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </span>
                      ))}
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
