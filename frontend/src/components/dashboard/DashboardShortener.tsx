import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCreateUrlMutation } from "@/hooks/useUrls";
import { authApi } from "@/api/auth.api";
import { useAuth } from "@/context/AuthContext";
import { getShortUrlDisplay, sanitizeAndNormalizeUrl } from "@/lib/urlUtils";
import { Button } from "@/components/ui/button";
import { Link2, Clipboard, ArrowRight, Loader2, AlertCircle, Hourglass, MailWarning } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { ShortURL } from "@/types/url.types";

interface DashboardShortenerProps {
  onUrlCreated?: (newUrl: ShortURL) => void;
}

export const DashboardShortener: React.FC<DashboardShortenerProps> = ({
  onUrlCreated,
}) => {
  const { user } = useAuth();
  const [inputVal, setInputVal] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0);
  const [srAnnouncement, setSrAnnouncement] = useState<string>("");
  const [needsVerification, setNeedsVerification] = useState(false);

  // Normal login already blocks unverified accounts, so this 403 can only be hit via
  // a stale/edge-case session - requireVerifiedEmail on the backend stays as
  // defense-in-depth, and this mirrors it on the frontend.
  const resendMutation = useMutation({
    mutationFn: () => authApi.resendVerification({ email: user?.email ?? "" }),
    onSuccess: () => {
      toast.success("Verification email sent. Check your inbox.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to resend verification email";
      toast.error(msg);
    },
  });

  const isRateLimited = rateLimitCountdown > 0;

  useEffect(() => {
    if (!isRateLimited) return;

    const interval = setInterval(() => {
      setRateLimitCountdown((prev) => {
        const next = Math.max(0, Number((prev - 0.1).toFixed(1)));
        if (next === 0) {
          setSrAnnouncement("Tokens replenished. Ready to shorten links.");
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRateLimited]);

  const fireMiniConfetti = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#818cf8", "#4f46e5", "#10b981"],
      });
    } catch {
      // Graceful fallback
    }
  };

  const createMutation = useCreateUrlMutation({
    onSuccess: (newUrl) => {
      setInputVal("");
      setErrorMessage(null);
      setNeedsVerification(false);
      fireMiniConfetti();
      toast.success(`Shortlink created! ${getShortUrlDisplay(newUrl.shortCode)}`);
      onUrlCreated?.(newUrl);
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const errorCode = err?.response?.data?.errorCode;

      if (status === 403 && errorCode === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
        setErrorMessage(null);
      } else if (status === 429) {
        // Parse retryAfterMs or Retry-After header
        const retryAfterMs = err?.response?.data?.retryAfterMs;
        const retryAfterHeader = err?.response?.headers?.["retry-after"];
        const waitSeconds = retryAfterMs
          ? retryAfterMs / 1000
          : retryAfterHeader
          ? parseFloat(retryAfterHeader)
          : 2.0;

        setRateLimitCountdown(waitSeconds);
        setSrAnnouncement(`Burst rate limit reached. Token refilling in ${Math.ceil(waitSeconds)} seconds.`);
        toast.warning(
          `Whoa, speed demon! 10 tokens used. Refilling in ${waitSeconds.toFixed(1)}s...`,
          {
            duration: Math.ceil(waitSeconds * 1000),
          }
        );
      } else {
        const msg = err?.response?.data?.message || "Failed to create shortlink";
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
  });

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputVal(text.trim());
        setErrorMessage(null);
        toast.info("Pasted from clipboard");
      }
    } catch {
      toast.error("Please allow clipboard access or use Ctrl+V");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rateLimitCountdown > 0 || createMutation.isPending) return;

    const { url, error } = sanitizeAndNormalizeUrl(inputVal);
    if (error || !url) {
      setErrorMessage(error || "Invalid URL format");
      return;
    }

    setErrorMessage(null);
    createMutation.mutate(url);
  };

  const isPending = createMutation.isPending;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite">
        {srAnnouncement}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center rounded-xl bg-card border transition-all p-1.5 sm:p-2 ${
          errorMessage
            ? "border-red-500/50 ring-2 ring-red-500/20"
            : isRateLimited
            ? "border-amber-500/50 ring-2 ring-amber-500/20"
            : "border-line-subtle focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-xl shadow-indigo-950/20"
        }`}
      >
        {/* Command Icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center pl-2 text-zinc-400">
          <Link2 className="h-4 w-4" />
        </div>

        {/* URL Input */}
        <div className="relative flex-1 px-2 flex items-center min-w-0">
          <input
            id="shortener-input"
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              if (errorMessage) setErrorMessage(null);
              if (needsVerification) setNeedsVerification(false);
            }}
            placeholder="Paste a long destination URL to shorten..."
            disabled={isPending || isRateLimited}
            className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-mono disabled:opacity-50"
            aria-label="Destination URL"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Auto-Paste Button */}
        {inputVal.length === 0 && !isRateLimited && (
          <button
            type="button"
            onClick={handlePaste}
            className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-md hover:bg-white/5 transition-colors mr-1 cursor-pointer"
            title="Paste from clipboard"
          >
            <Clipboard className="h-3.5 w-3.5" />
            <span>Paste</span>
          </button>
        )}

        {/* Shorten / Countdown Button */}
        <Button
          type="submit"
          variant={isRateLimited ? "outline" : "default"}
          size="default"
          disabled={isPending || isRateLimited || inputVal.trim().length === 0}
          aria-live="off"
          className={`h-10 sm:h-11 px-4 sm:px-5 rounded-xl gap-2 text-xs sm:text-sm shrink-0 font-medium ${
            isRateLimited ? "border-amber-500/30 text-amber-300 bg-amber-500/10 cursor-not-allowed" : ""
          }`}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating...</span>
            </>
          ) : isRateLimited ? (
            <>
              <Hourglass className="h-4 w-4 animate-spin" />
              <span className="font-mono">Refilling in {rateLimitCountdown.toFixed(1)}s...</span>
            </>
          ) : (
            <>
              <span>Shorten Link</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Inline Validation / Rate Limit Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 px-3">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Email Not Verified Notice */}
      {needsVerification && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <MailWarning className="h-3.5 w-3.5 shrink-0" />
            <span>Verify your email to start creating short links.</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={resendMutation.isPending}
            onClick={() => resendMutation.mutate()}
            className="h-7 shrink-0 border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
          >
            {resendMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <span>Resend verification email</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
