import React, { useLayoutEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen || !canvasRef.current || !shortUrl) return;

    // Render high-res QR code on canvas with rounded styling
    QRCode.toCanvas(
      canvasRef.current,
      shortUrl,
      {
        width: 256,
        margin: 2,
        color: {
          dark: "#0b0b0c",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      },
      (error) => {
        if (error) {
          console.error("QR Code generation error:", error);
        }
      }
    );
  }, [isOpen, shortUrl]);

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
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
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopied(true);
          toast.success("QR Code copied to clipboard!");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Clipboard image copy not supported in this browser");
        }
      });
    } catch {
      toast.error("Failed to copy QR code");
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
          <canvas ref={canvasRef} width={256} height={256} className="rounded-lg max-w-full h-auto" />
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
            className="gap-1.5 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Image"}
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPng}
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
