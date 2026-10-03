import {
  User,
  ShieldCheck,
  MemoryStick,
  Lock,
  Database,
  CornerUpRight,
  Layers,
  Cpu,
  ChartColumn,
  type LucideIcon,
} from "lucide-react";

export type NodeId =
  | "visitor"
  | "bloom"
  | "cache"
  | "lock"
  | "db"
  | "redirect"
  | "queue"
  | "worker"
  | "clicksDb"
  | "dashboard";

export type EdgeId =
  | "visitor-bloom"
  | "bloom-cache"
  | "cache-redirect"
  | "cache-lock"
  | "lock-db"
  | "db-redirect"
  | "redirect-queue"
  | "queue-worker"
  | "worker-clicksDb"
  | "clicksDb-dashboard";

export interface DiagramNode {
  title: string;
  subtitle: string;
  /** Plain-English note shown in the caption bar. */
  note: string;
  /** Technical tag shown under the note, in mono. */
  tag: string;
  icon: LucideIcon;
}

export interface DiagramEdge {
  from: NodeId;
  to: NodeId;
  label: string;
  /** Background (async) hop, drawn dashed. */
  async?: boolean;
}

export const NODES: Record<NodeId, DiagramNode> = {
  visitor: {
    title: "Visitor",
    subtitle: "clicks a short link",
    note: "Someone opens your short link.",
    tag: "GET /r/:code",
    icon: User,
  },
  bloom: {
    title: "Bloom filter",
    subtitle: "RedisBloom",
    note: "Made-up codes are turned away here, before any lookup.",
    tag: "BF.EXISTS · fails open",
    icon: ShieldCheck,
  },
  cache: {
    title: "Redis cache",
    subtitle: "shortCode:<code>",
    note: "Most redirects are answered from memory right here.",
    tag: "cache-aside · hot links re-warmed every 15 min",
    icon: MemoryStick,
  },
  lock: {
    title: "Rebuild lock",
    subtitle: "one request per link",
    note: "On a miss, only one request goes to the database. The rest wait for the cache.",
    tag: "SET NX EX · Lua release",
    icon: Lock,
  },
  db: {
    title: "PostgreSQL",
    subtitle: "source of truth",
    note: "The link is read once and put back in the cache.",
    tag: "Neon · Prisma",
    icon: Database,
  },
  redirect: {
    title: "302 redirect",
    subtitle: "to the long URL",
    note: "The visitor lands on the original page.",
    tag: "302 Found",
    icon: CornerUpRight,
  },
  queue: {
    title: "Click queue",
    subtitle: "BullMQ",
    note: "The click is noted without slowing the redirect down.",
    tag: "analytics-queue",
    icon: Layers,
  },
  worker: {
    title: "Worker",
    subtitle: "separate process",
    note: "Saves each click in the background, and retries if it fails.",
    tag: "retries → dead-letter queue",
    icon: Cpu,
  },
  clicksDb: {
    title: "PostgreSQL",
    subtitle: "click records",
    note: "Each click is stored with its device, country and referrer.",
    tag: "recordClick",
    icon: Database,
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "your analytics",
    note: "You see the clicks come in.",
    tag: "refreshes every 15 s",
    icon: ChartColumn,
  },
};

export const EDGES: Record<EdgeId, DiagramEdge> = {
  "visitor-bloom": { from: "visitor", to: "bloom", label: "GET /r/:code" },
  "bloom-cache": { from: "bloom", to: "cache", label: "might exist" },
  "cache-redirect": { from: "cache", to: "redirect", label: "hit" },
  "cache-lock": { from: "cache", to: "lock", label: "miss" },
  "lock-db": { from: "lock", to: "db", label: "acquire" },
  "db-redirect": { from: "db", to: "redirect", label: "re-cache" },
  "redirect-queue": { from: "redirect", to: "queue", label: "enqueue", async: true },
  "queue-worker": { from: "queue", to: "worker", label: "consume" },
  "worker-clicksDb": { from: "worker", to: "clicksDb", label: "insert" },
  "clicksDb-dashboard": { from: "clicksDb", to: "dashboard", label: "query" },
};

export type RouteKind = "hit" | "miss";

const ANALYTICS_EDGES: EdgeId[] = [
  "redirect-queue",
  "queue-worker",
  "worker-clicksDb",
  "clicksDb-dashboard",
];

export const ROUTES: Record<RouteKind, EdgeId[]> = {
  hit: ["visitor-bloom", "bloom-cache", "cache-redirect", ...ANALYTICS_EDGES],
  miss: ["visitor-bloom", "bloom-cache", "cache-lock", "lock-db", "db-redirect", ...ANALYTICS_EDGES],
};

/** Most requests hit the cache; every third loop shows the miss path. */
export const ROUTE_PATTERN: RouteKind[] = ["hit", "hit", "miss"];

/** Nodes and edges only used on the miss path, dimmed while the loop shows a hit. */
export const MISS_ONLY_NODES: NodeId[] = ["lock", "db"];
export const MISS_ONLY_EDGES: EdgeId[] = ["cache-lock", "lock-db", "db-redirect"];

type Point = [number, number];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiagramLayout {
  width: number;
  height: number;
  nodes: Record<NodeId, Rect>;
  /** Polyline for each edge, in viewBox units; the last point is the arrow tip. */
  edges: Record<EdgeId, { points: Point[]; labelAt: Point }>;
  groups: { label: string; rect: Rect }[];
  /** Where the "cache hit / cache miss" chip sits (its top-right corner). */
  statusAt: Point;
}

// Desktop: two lanes, left to right. Nodes are 160×64 with 106-unit gaps for edge labels.
export const DESKTOP_LAYOUT: DiagramLayout = {
  width: 1000,
  height: 480,
  nodes: {
    visitor: { x: 24, y: 52, w: 160, h: 64 },
    bloom: { x: 290, y: 52, w: 160, h: 64 },
    cache: { x: 556, y: 52, w: 160, h: 64 },
    redirect: { x: 816, y: 52, w: 160, h: 64 },
    lock: { x: 556, y: 164, w: 160, h: 64 },
    db: { x: 816, y: 164, w: 160, h: 64 },
    queue: { x: 24, y: 360, w: 160, h: 64 },
    worker: { x: 290, y: 360, w: 160, h: 64 },
    clicksDb: { x: 556, y: 360, w: 160, h: 64 },
    dashboard: { x: 816, y: 360, w: 160, h: 64 },
  },
  edges: {
    "visitor-bloom": { points: [[184, 84], [290, 84]], labelAt: [237, 84] },
    "bloom-cache": { points: [[450, 84], [556, 84]], labelAt: [503, 84] },
    "cache-redirect": { points: [[716, 84], [816, 84]], labelAt: [766, 84] },
    "cache-lock": { points: [[636, 116], [636, 164]], labelAt: [636, 140] },
    "lock-db": { points: [[716, 196], [816, 196]], labelAt: [766, 196] },
    "db-redirect": { points: [[896, 164], [896, 116]], labelAt: [896, 140] },
    "redirect-queue": {
      points: [[976, 84], [990, 84], [990, 278], [104, 278], [104, 360]],
      labelAt: [547, 278],
    },
    "queue-worker": { points: [[184, 392], [290, 392]], labelAt: [237, 392] },
    "worker-clicksDb": { points: [[450, 392], [556, 392]], labelAt: [503, 392] },
    "clicksDb-dashboard": { points: [[716, 392], [816, 392]], labelAt: [766, 392] },
  },
  groups: [
    { label: "Redirect path", rect: { x: 0, y: 0, w: 1000, h: 256 } },
    { label: "Analytics pipeline", rect: { x: 0, y: 300, w: 1000, h: 180 } },
  ],
  statusAt: [984, 16],
};

// Mobile: two columns that zig-zag downwards. Nodes are 132×60 with a 72-unit gutter.
export const MOBILE_LAYOUT: DiagramLayout = {
  width: 360,
  height: 740,
  nodes: {
    visitor: { x: 12, y: 44, w: 132, h: 60 },
    bloom: { x: 12, y: 154, w: 132, h: 60 },
    cache: { x: 12, y: 264, w: 132, h: 60 },
    lock: { x: 216, y: 264, w: 132, h: 60 },
    redirect: { x: 12, y: 374, w: 132, h: 60 },
    db: { x: 216, y: 374, w: 132, h: 60 },
    queue: { x: 12, y: 542, w: 132, h: 60 },
    worker: { x: 216, y: 542, w: 132, h: 60 },
    dashboard: { x: 12, y: 652, w: 132, h: 60 },
    clicksDb: { x: 216, y: 652, w: 132, h: 60 },
  },
  edges: {
    "visitor-bloom": { points: [[78, 104], [78, 154]], labelAt: [78, 129] },
    "bloom-cache": { points: [[78, 214], [78, 264]], labelAt: [78, 239] },
    "cache-redirect": { points: [[78, 324], [78, 374]], labelAt: [78, 349] },
    "cache-lock": { points: [[144, 294], [216, 294]], labelAt: [180, 294] },
    "lock-db": { points: [[282, 324], [282, 374]], labelAt: [282, 349] },
    "db-redirect": { points: [[216, 404], [144, 404]], labelAt: [180, 404] },
    "redirect-queue": { points: [[78, 434], [78, 542]], labelAt: [78, 478] },
    "queue-worker": { points: [[144, 572], [216, 572]], labelAt: [180, 572] },
    "worker-clicksDb": { points: [[282, 602], [282, 652]], labelAt: [282, 627] },
    "clicksDb-dashboard": { points: [[216, 682], [144, 682]], labelAt: [180, 682] },
  },
  groups: [
    { label: "Redirect path", rect: { x: 0, y: 0, w: 360, h: 458 } },
    { label: "Analytics pipeline", rect: { x: 0, y: 498, w: 360, h: 242 } },
  ],
  statusAt: [348, 14],
};
