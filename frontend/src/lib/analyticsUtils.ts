/**
 * Analytics Utility Functions
 * Supports geographic formatting, privacy-preserving IP masking,
 * intelligent referrer normalization, relative time localization,
 * and user-agent categorization.
 */

/**
 * Converts ISO 3166-1 alpha-2 country code into localized flag emoji.
 */
export function getCountryFlag(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2 || countryCode === "Unknown" || countryCode === "N/A") {
    return "🌐";
  }
  const upper = countryCode.toUpperCase();
  const codePoints = upper
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

/**
 * Returns human-readable country name from ISO code.
 */
export function getCountryName(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode === "Unknown" || countryCode === "N/A") {
    return "Unknown Region";
  }
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return displayNames.of(countryCode.toUpperCase()) || countryCode;
  } catch {
    return countryCode;
  }
}

/**
 * Anonymizes raw IP address in accordance with GDPR privacy standards.
 * IPv4 -> 192.168.***.***
 * IPv6 -> 2a02:8108:***
 */
export function maskIpAddress(ip: string | null | undefined): string {
  if (!ip) return "—";
  const trimmed = ip.trim();
  if (trimmed.includes(".")) {
    const parts = trimmed.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    return `${parts[0]}.***.***`;
  }
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    return `${parts.slice(0, 2).join(":")}:***`;
  }
  return `${trimmed.slice(0, 4)}***`;
}

/**
 * Normalizes referrers, detecting major social networks, search engines, or direct entries.
 */
export function normalizeReferrer(referrer: string | null | undefined): {
  name: string;
  domain: string;
  isDirect: boolean;
} {
  if (!referrer || referrer.trim() === "" || referrer.toLowerCase() === "direct") {
    return { name: "Direct / Private", domain: "direct", isDirect: true };
  }
  const lower = referrer.toLowerCase();
  if (lower.includes("t.co") || lower.includes("twitter") || lower.includes("x.com")) {
    return { name: "Twitter / X", domain: "x.com", isDirect: false };
  }
  if (lower.includes("linkedin")) {
    return { name: "LinkedIn", domain: "linkedin.com", isDirect: false };
  }
  if (lower.includes("github")) {
    return { name: "GitHub", domain: "github.com", isDirect: false };
  }
  if (lower.includes("youtube") || lower.includes("youtu.be")) {
    return { name: "YouTube", domain: "youtube.com", isDirect: false };
  }
  if (lower.includes("instagram")) {
    return { name: "Instagram", domain: "instagram.com", isDirect: false };
  }
  if (lower.includes("facebook") || lower.includes("fb.me")) {
    return { name: "Facebook", domain: "facebook.com", isDirect: false };
  }
  if (lower.includes("reddit")) {
    return { name: "Reddit", domain: "reddit.com", isDirect: false };
  }
  if (lower.includes("google")) {
    return { name: "Google", domain: "google.com", isDirect: false };
  }

  try {
    const url = new URL(referrer.startsWith("http") ? referrer : `https://${referrer}`);
    return { name: url.hostname.replace(/^www\./, ""), domain: url.hostname, isDirect: false };
  } catch {
    return { name: referrer, domain: referrer, isDirect: false };
  }
}

/**
 * Formats ISO timestamp into compact localized relative time.
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0 || diffInSeconds < 60) {
      return "just now";
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "recently";
  }
}

export type DeviceCategory = "Desktop" | "Mobile" | "Tablet" | "Unknown";

/**
 * Classifies a click into Desktop, Mobile, Tablet, or Unknown based on explicit fields or UA.
 */
export function classifyDevice(device: string | null | undefined, userAgent: string | null | undefined): DeviceCategory {
  if (device) {
    const dLower = device.toLowerCase();
    if (dLower === "mobile") return "Mobile";
    if (dLower === "tablet") return "Tablet";
    if (dLower === "desktop") return "Desktop";
  }

  if (userAgent) {
    if (/(ipad|android(?!.*mobile))/i.test(userAgent)) return "Tablet";
    if (/(iphone|ipod|android.*mobile|blackberry|windows phone)/i.test(userAgent)) return "Mobile";
    if (/(macintosh|windows nt|linux)/i.test(userAgent)) return "Desktop";
  }

  return "Unknown";
}

/**
 * Resolves browser label from explicit field or UA string.
 */
export function resolveBrowserName(browser: string | null | undefined, userAgent: string | null | undefined): string {
  if (browser && browser !== "Unknown") return browser;
  if (!userAgent) return "Browser";

  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/") && !ua.includes("edg/")) return "Chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("opera/") || ua.includes("opr/")) return "Opera";
  return "Web Browser";
}

/**
 * Resolves Operating System label from explicit field or UA string.
 */
export function resolveOsName(os: string | null | undefined, userAgent: string | null | undefined): string {
  if (os && os !== "Unknown") return os;
  if (!userAgent) return "OS";

  const ua = userAgent.toLowerCase();
  if (ua.includes("mac os x") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("linux")) return "Linux";
  return "System";
}
