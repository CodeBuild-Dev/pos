import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const containerId = "barcode-reader";

  useEffect(() => {
    if (!open) return;

    // Small delay to ensure the DOM element is rendered
    const timeout = setTimeout(() => {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            onScan(decodedText);
            // Stop after successful scan
            scanner.stop().catch(() => {});
            onClose();
          },
          () => {
            // Ignore scan failures (no code found in frame)
          }
        )
        .then(() => {
          setScanning(true);
          setError(null);
        })
        .catch((err: Error) => {
          setError(
            err.message?.includes("Permission")
              ? "Camera permission denied. Please allow camera access."
              : "Could not start camera. Make sure no other app is using it."
          );
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      setScanning(false);
      setError(null);
    };
  }, [open, onScan, onClose]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a product barcode or QR code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            id={containerId}
            className="w-full overflow-hidden rounded-lg bg-muted"
            style={{ minHeight: 280 }}
          />

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <CameraOff className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {scanning && !error && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Scanning... hold the barcode steady
            </p>
          )}

          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
