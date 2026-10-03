import React from "react";
import { useDeleteUrlMutation } from "@/hooks/useUrls";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { getShortUrlDisplay } from "@/lib/urlUtils";
import { toast } from "sonner";
import type { ShortURL } from "@/types/url.types";

interface DeleteLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: ShortURL | null;
}

export const DeleteLinkDialog: React.FC<DeleteLinkDialogProps> = ({
  isOpen,
  onClose,
  url,
}) => {
  const deleteMutation = useDeleteUrlMutation({
    onSuccess: () => {
      toast.success("Shortlink deleted successfully");
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to delete link";
      toast.error(msg);
    },
  });

  if (!url) return null;

  const isPending = deleteMutation.isPending;

  const handleDelete = () => {
    if (isPending) return;
    deleteMutation.mutate(url.shortCode);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <AlertDialogContent
        className="max-w-md sm:rounded-2xl border-red-500/20 bg-card"
        onEscapeKeyDown={(e) => {
          if (isPending) e.preventDefault();
        }}
      >
        <AlertDialogHeader className="space-y-2 text-left">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <AlertDialogTitle className="text-lg font-semibold text-zinc-100">
            Delete Shortlink Permanently?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-zinc-400 leading-relaxed">
            This action is permanent and cannot be undone. Any QR codes, printed materials, or visitors navigating to{" "}
            <span className="font-mono text-zinc-200">{getShortUrlDisplay(url.shortCode)}</span> will receive an immediate HTTP 404 Not Found error.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Link summary snippet */}
        <div className="rounded-lg bg-surface/50 border border-line-subtle p-3 space-y-1 text-xs font-mono">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Shortlink:</span>
            <span className="text-indigo-400 font-semibold">{getShortUrlDisplay(url.shortCode)}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Destination:</span>
            <span className="text-zinc-300 truncate max-w-[220px]" title={url.originalUrl}>
              {url.originalUrl}
            </span>
          </div>
        </div>

        <AlertDialogFooter className="pt-2 gap-2 sm:gap-0">
          <AlertDialogCancel asChild>
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
          </AlertDialogCancel>
          <AlertDialogAction
            asChild
            // Radix closes the alert dialog on any Action click by default (it's
            // implemented as a Dialog.Close under the hood). Deletion is async, so
            // we prevent that default close here and let onSuccess call onClose()
            // once the mutation actually finishes — keeping the "Deleting..." state visible.
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
          >
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              className="gap-1.5 text-xs shadow-md shadow-red-500/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Permanently</span>
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
