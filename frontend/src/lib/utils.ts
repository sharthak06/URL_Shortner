import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes conditionally without style conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const fullFormatter = new Intl.NumberFormat("en");

/** Exact counts until they get long, then 14.2K-style so numbers never reflow their container. */
export function formatCount(value: number): string {
  return value > 9_999 ? compactFormatter.format(value) : fullFormatter.format(value);
}
