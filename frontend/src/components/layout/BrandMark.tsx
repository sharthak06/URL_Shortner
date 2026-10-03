import React from "react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

/**
 * Shortr brand mark: a dotted "long route" baseline with a single arc that
 * hops straight from the origin node (emerald) to the destination (indigo
 * arrowhead) — the shortcut a short link takes over the long URL.
 * Reserved for the brand only; don't reuse it as a feature icon.
 */
export const BrandMark: React.FC<BrandMarkProps> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={cn("h-4 w-4", className)}
  >
    <path
      d="M4 17.5H20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="0.5 3"
      className="text-zinc-500"
    />
    <path
      d="M5.5 17.5C5.5 8 18 8 18 16"
      stroke="#818cf8"
      strokeWidth="2.25"
      strokeLinecap="round"
    />
    <path
      d="M15 13.25L18 16.25L21 13.25"
      stroke="#818cf8"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="5.5" cy="17.5" r="2" fill="#10b981" />
  </svg>
);
