const ALLOWED_PROTOCOLS = ["http:", "https:"];

// Where short links are served from. Set VITE_SHORT_URL_BASE in production (e.g. https://shortr.link);
// locally it falls back to the current origin, which proxies /r to the backend.
const SHORT_URL_BASE: string = (import.meta.env.VITE_SHORT_URL_BASE || window.location.origin).replace(/\/+$/, "");

/** The hostname short links are served from — tracks whatever SHORT_URL_BASE resolves to. */
export function getShortUrlHostname(): string {
  try {
    return new URL(SHORT_URL_BASE).hostname;
  } catch {
    return window.location.hostname;
  }
}

/** The full, working short link: what gets copied, opened and encoded in QR codes. */
export function getShortUrl(shortCode: string): string {
  return `${SHORT_URL_BASE}/r/${shortCode}`;
}

/** The same link without the protocol, for display. Always matches what getShortUrl copies. */
export function getShortUrlDisplay(shortCode: string): string {
  return getShortUrl(shortCode).replace(/^https?:\/\//, "");
}

/**
 * Sanitizes, validates, and normalizes candidate URL input.
 * Eliminates DOM-based XSS (javascript:, data:) and auto-prepends https:// when omitted.
 */
export function sanitizeAndNormalizeUrl(rawInput: string): { url: string; error?: string } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { url: "", error: "Please enter a destination URL." };
  }

  let candidate = trimmed;
  // Auto-prepend https:// if no protocol scheme is present
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return { url: "", error: "Only http:// and https:// URLs are allowed." };
    }
    // Prevent invalid or incomplete hostnames
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return { url: "", error: "Please enter a valid domain (e.g. domain.com)." };
    }
    return { url: parsed.toString() };
  } catch {
    return { url: "", error: "Invalid URL format. Please enter a valid web address." };
  }
}

/**
 * Resolves high-resolution domain favicon with fallback.
 */
export function getDomainFaviconUrl(urlStr: string): string {
  try {
    const hostname = new URL(urlStr).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "";
  }
}
