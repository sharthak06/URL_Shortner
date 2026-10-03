import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { snappyTransition } from "@/lib/motion";
import {
  DESKTOP_LAYOUT,
  EDGES,
  MISS_ONLY_EDGES,
  MISS_ONLY_NODES,
  MOBILE_LAYOUT,
  NODES,
  ROUTES,
  ROUTE_PATTERN,
  type DiagramLayout,
  type EdgeId,
  type NodeId,
} from "./architectureLayout";

/** How long the dot rests on each node, so the caption can be read. */
const DWELL_MS = 1100;

type Phase = "move" | "dwell";

interface Playhead {
  loop: number;
  /** Index into the current route's edges; -1 means resting on the first node. */
  step: number;
  phase: Phase;
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

const polylineLength = (points: [number, number][]) =>
  points.slice(1).reduce((sum, [x, y], i) => {
    const [px, py] = points[i];
    return sum + Math.hypot(x - px, y - py);
  }, 0);

const toPath = (points: [number, number][]) =>
  points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");

export const ArchitectureDiagram: React.FC = () => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const layout: DiagramLayout = isDesktop ? DESKTOP_LAYOUT : MOBILE_LAYOUT;
  const markerId = useId();

  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.3 });
  const reduceMotion = useReducedMotion();

  const [playhead, setPlayhead] = useState<Playhead>({ loop: 0, step: -1, phase: "dwell" });
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const [focused, setFocused] = useState<NodeId | null>(null);
  const [pinned, setPinned] = useState<NodeId | null>(null);

  const selected = pinned ?? hovered ?? focused;
  const animate = !reduceMotion;
  const paused = !animate || !inView || selected !== null;

  const routeKind = ROUTE_PATTERN[playhead.loop % ROUTE_PATTERN.length];
  const route = ROUTES[routeKind];
  const currentEdgeId: EdgeId | null = playhead.step >= 0 ? route[playhead.step] : null;
  const currentEdge = currentEdgeId ? EDGES[currentEdgeId] : null;

  // The node the dot last reached; the caption narrates it.
  const activeNode: NodeId | null = !animate
    ? null
    : !currentEdge
    ? "visitor"
    : playhead.phase === "dwell"
    ? currentEdge.to
    : currentEdge.from;
  const movingEdge = animate && playhead.phase === "move" ? currentEdgeId : null;

  // Rest on a node, then set off along the next edge (or start the next loop).
  useEffect(() => {
    if (paused || playhead.phase !== "dwell") return;
    const timer = window.setTimeout(() => {
      setPlayhead((prev) => {
        const edges = ROUTES[ROUTE_PATTERN[prev.loop % ROUTE_PATTERN.length]];
        return prev.step + 1 < edges.length
          ? { loop: prev.loop, step: prev.step + 1, phase: "move" }
          : { loop: prev.loop + 1, step: -1, phase: "dwell" };
      });
    }, DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [paused, playhead]);

  const captionNode = selected ?? activeNode;
  const caption = captionNode ? NODES[captionNode] : null;
  const isMissOnlyDimmed = animate && routeKind === "hit" && selected === null;

  // Dot position/animation for the current step
  let dot: React.ReactNode = null;
  if (animate) {
    const restPoint =
      currentEdgeId === null
        ? (() => {
            const r = layout.nodes.visitor;
            return [r.x + r.w / 2, r.y + r.h / 2] as [number, number];
          })()
        : null;

    if (restPoint) {
      dot = <circle cx={restPoint[0]} cy={restPoint[1]} r={3.5} className="fill-emerald-400" />;
    } else if (currentEdgeId) {
      const points = layout.edges[currentEdgeId].points;
      const [start] = points;
      const end = points[points.length - 1];

      if (playhead.phase === "dwell" || paused) {
        const [x, y] = playhead.phase === "dwell" ? end : start;
        dot = <circle cx={x} cy={y} r={3.5} className="fill-emerald-400" />;
      } else {
        const length = polylineLength(points);
        let travelled = 0;
        const times = points.map(([x, y], i) => {
          if (i > 0) travelled += Math.hypot(x - points[i - 1][0], y - points[i - 1][1]);
          return travelled / length;
        });
        dot = (
          <motion.circle
            key={`${playhead.loop}-${playhead.step}-${isDesktop}`}
            r={3.5}
            className="fill-emerald-400"
            initial={{ cx: start[0], cy: start[1] }}
            animate={{ cx: points.map((p) => p[0]), cy: points.map((p) => p[1]) }}
            transition={{
              duration: Math.min(Math.max(length / 420, 0.5), 1.8),
              ease: points.length > 2 ? "linear" : "easeInOut",
              times,
            }}
            onAnimationComplete={() =>
              setPlayhead((prev) =>
                prev.loop === playhead.loop && prev.step === playhead.step
                  ? { ...prev, phase: "dwell" }
                  : prev
              )
            }
          />
        );
      }
    }
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={cn("relative mx-auto w-full", isDesktop ? "max-w-5xl" : "max-w-[400px]")}
        style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
        onMouseLeave={() => setHovered(null)}
      >
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              markerUnits="userSpaceOnUse"
              orient="auto"
            >
              <path d="M0 0.5 L7 4 L0 7.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            </marker>
          </defs>

          {layout.groups.map((group) => (
            <rect
              key={group.label}
              x={group.rect.x + 0.5}
              y={group.rect.y + 0.5}
              width={group.rect.w - 1}
              height={group.rect.h - 1}
              rx={16}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {(Object.keys(layout.edges) as EdgeId[]).map((id) => {
            const edge = EDGES[id];
            const isMoving = movingEdge === id;
            const isDimmed = isMissOnlyDimmed && MISS_ONLY_EDGES.includes(id);
            return (
              <path
                key={id}
                d={toPath(layout.edges[id].points)}
                fill="none"
                stroke={isMoving ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.12)"}
                strokeWidth={1}
                strokeDasharray={edge.async ? "3 4" : undefined}
                vectorEffect="non-scaling-stroke"
                markerEnd={`url(#${markerId})`}
                className="transition-[stroke,opacity] duration-300"
                opacity={isDimmed ? 0.45 : 1}
              />
            );
          })}

          {dot}
        </svg>

        {/* Group labels */}
        {layout.groups.map((group) => (
          <span
            key={group.label}
            className="pointer-events-none absolute font-mono text-[10px] sm:text-[11px] tracking-wide text-zinc-400"
            style={{
              left: pct(group.rect.x + 14, layout.width),
              top: pct(group.rect.y + 10, layout.height),
            }}
          >
            {group.label}
          </span>
        ))}

        {/* Cache hit / miss status */}
        {animate && (
          <div
            className="pointer-events-none absolute -translate-x-full"
            style={{ left: pct(layout.statusAt[0], layout.width), top: pct(layout.statusAt[1] - 4, layout.height) }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={routeKind}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={snappyTransition}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[10px]",
                  routeKind === "hit"
                    ? "border-emerald-400/20 text-emerald-300/90"
                    : "border-line text-zinc-400"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    routeKind === "hit" ? "bg-emerald-400" : "bg-zinc-500"
                  )}
                />
                cache {routeKind}
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {/* Edge labels */}
        {(Object.keys(layout.edges) as EdgeId[]).map((id) => {
          const [x, y] = layout.edges[id].labelAt;
          const isDimmed = isMissOnlyDimmed && MISS_ONLY_EDGES.includes(id);
          return (
            <span
              key={id}
              className={cn(
                "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded border border-line-subtle bg-canvas px-1.5 py-px font-mono text-[9px] sm:text-[10px] text-zinc-400 transition-opacity duration-300",
                isDimmed && "opacity-50"
              )}
              style={{ left: pct(x, layout.width), top: pct(y, layout.height) }}
            >
              {EDGES[id].label}
            </span>
          );
        })}

        {/* Nodes */}
        {(Object.keys(layout.nodes) as NodeId[]).map((id) => {
          const rect = layout.nodes[id];
          const node = NODES[id];
          const Icon = node.icon;
          const isSelected = selected === id;
          const isActive = !selected && activeNode === id;
          const isDimmed = isMissOnlyDimmed && MISS_ONLY_NODES.includes(id);

          return (
            <button
              key={id}
              type="button"
              aria-pressed={pinned === id}
              aria-describedby="architecture-caption"
              onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(id)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(null)}
              onFocus={() => setFocused(id)}
              onBlur={() => setFocused(null)}
              onClick={() => setPinned((prev) => (prev === id ? null : id))}
              className={cn(
                "absolute flex items-center gap-2.5 rounded-xl border bg-card px-3 text-left transition-[border-color,background-color,opacity] duration-300 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40",
                isSelected
                  ? "border-emerald-400/50 bg-card-hover"
                  : isActive
                  ? "border-emerald-400/35"
                  : "border-line hover:border-line-strong",
                isDimmed && "opacity-50"
              )}
              style={{
                left: pct(rect.x, layout.width),
                top: pct(rect.y, layout.height),
                width: pct(rect.w, layout.width),
                height: pct(rect.h, layout.height),
              }}
            >
              <Icon
                className={cn(
                  "hidden h-4 w-4 shrink-0 transition-colors duration-300 sm:block",
                  isSelected || isActive ? "text-emerald-300" : "text-zinc-500"
                )}
                strokeWidth={1.75}
              />
              <span className="min-w-0">
                <span className="block truncate text-[13px] sm:text-sm font-semibold text-zinc-100">
                  {node.title}
                </span>
                <span className="block truncate font-mono text-[10px] sm:text-[11px] text-zinc-400">
                  {node.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Caption: follows the dot, or the node you hover / tap */}
      <div
        className={cn(
          "mx-auto mt-6 flex w-full flex-col gap-3 border-t border-line-subtle pt-5 sm:flex-row sm:items-start sm:justify-between",
          isDesktop ? "max-w-5xl" : "max-w-[400px]"
        )}
      >
        <div id="architecture-caption" aria-live={selected ? "polite" : "off"} className="min-h-[4.5rem] min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {caption ? (
              <motion.div
                key={captionNode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <p className="text-sm font-medium text-zinc-100">{caption.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{caption.note}</p>
                <p className="mt-1.5 font-mono text-[11px] text-emerald-400/80">{caption.tag}</p>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-zinc-500"
              >
                Hover or tap any step to see what it does.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 items-center gap-4 font-mono text-[10px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <svg aria-hidden="true" width="18" height="2">
              <line x1="0" y1="1" x2="18" y2="1" stroke="rgba(255,255,255,0.3)" />
            </svg>
            request
          </span>
          <span className="flex items-center gap-1.5">
            <svg aria-hidden="true" width="18" height="2">
              <line x1="0" y1="1" x2="18" y2="1" stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
            </svg>
            background
          </span>
        </div>
      </div>
    </div>
  );
};
