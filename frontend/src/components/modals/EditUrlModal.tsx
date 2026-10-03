import React, { useState, useEffect } from "react";
import { useUpdateUrlMutation } from "@/hooks/useUrls";
import { getShortUrlDisplay, getShortUrlHostname, sanitizeAndNormalizeUrl } from "@/lib/urlUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Link2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { ShortURL } from "@/types/url.types";

interface EditUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: ShortURL | null;
}

export const EditUrlModal: React.FC<EditUrlModalProps> = ({
  isOpen,
  onClose,
  url,
}) => {
  const [newUrl, setNewUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      setNewUrl(url.originalUrl);
      setErrorMessage(null);
    }
  }, [url, isOpen]);

  const updateMutation = useUpdateUrlMutation({
    onSuccess: () => {
      toast.success("Destination URL updated successfully!");
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to update destination URL";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  if (!url) return null;

  const isDirty = newUrl.trim() !== url.originalUrl.trim();
  const isPending = updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || isPending) return;

    const { url: sanitized, error } = sanitizeAndNormalizeUrl(newUrl);
    if (error || !sanitized) {
      setErrorMessage(error || "Invalid URL format");
      return;
    }

    // Circular redirect prevention: prevent redirecting to self or current host
    try {
      const parsed = new URL(sanitized);
      if (
        parsed.hostname === window.location.hostname ||
        parsed.hostname === getShortUrlHostname()
      ) {
        setErrorMessage("Destination cannot point to the shortener service itself.");
        return;
      }
    } catch {
      setErrorMessage("Invalid destination URL");
      return;
    }

    setErrorMessage(null);
    updateMutation.mutate({
      shortCode: url.shortCode,
      updatedOriginalUrl: sanitized,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-indigo-400" />
            <span>Edit Destination URL</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Existing shortlinks, printed QR codes, and shared links will automatically route to the new destination.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Read-Only Shortcode Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>Shortlink (Immutable)</span>
              <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            </label>
            <div className="flex items-center px-3 py-2 rounded-lg bg-surface/50 border border-line-subtle text-xs font-mono text-indigo-400 select-all">
              {getShortUrlDisplay(url.shortCode)}
            </div>
          </div>

          {/* Editable Destination URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              New Destination Target
            </label>
            <Input
              type="text"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="https://example.com/new-path"
              disabled={isPending}
              required
              autoFocus
              className="bg-surface/80 font-mono text-xs sm:text-sm"
            />
          </div>

          {/* Validation Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 px-1">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isDirty || isPending}
              className="gap-1.5 text-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <span>Save Changes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
