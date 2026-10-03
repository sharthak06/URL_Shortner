import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortUrl: string;
  originalUrl: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  shortUrl,
  originalUrl,
}) => {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Generate the QR as a data URL (not drawn straight to a canvas): an <img>
  // doesn't depend on the canvas being mounted at the exact moment the effect
  // runs, so it can't silently render blank when the dialog mounts.
  useEffect(() => {
    if (!isOpen || !shortUrl) return;

    let cancelled = false;
    QRCode.toDataURL(shortUrl, {
      width: 512, // high-res source; displayed at 256 for crisp scaling/download
      margin: 2,
      color: {
        dark: "#0b0b0c",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((error) => {
        console.error("QR Code generation error:", error);
        toast.error("Failed to generate QR code");
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, shortUrl]);

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    try {
      const link = document.createElement("a");
      link.download = `shortr-qr-${shortUrl.split("/").pop() || "code"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("QR Code downloaded as high-res PNG");
    } catch {
      toast.error("Failed to download QR code");
    }
  };

  const handleCopyImage = async () => {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      toast.success("QR Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard image copy not supported in this browser");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm sm:rounded-2xl text-center">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold text-zinc-100">
            Branded QR Code
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Scannable with any mobile camera. High error tolerance.
          </DialogDescription>
        </DialogHeader>

        {/* QR Display Card */}
        <div className="flex flex-col items-center justify-center p-4 my-2 rounded-xl bg-white shadow-inner">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR code for ${shortUrl}`}
              width={256}
              height={256}
              className="rounded-lg max-w-full h-auto"
            />
          ) : (
            <div className="flex h-[256px] w-[256px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          )}
        </div>

        {/* URL Meta details */}
        <div className="space-y-1 text-left px-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono">Short Link:</span>
            <span className="font-mono font-medium text-indigo-400 truncate max-w-[200px]">
              {shortUrl}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono">Target:</span>
            <span className="text-zinc-400 truncate max-w-[200px]" title={originalUrl}>
              {originalUrl}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyImage}
            disabled={!dataUrl}
            className="gap-1.5 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Image"}
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPng}
            disabled={!dataUrl}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
