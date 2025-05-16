'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface MobileDownloadButtonProps {
  mode: 'pfp' | 'banner';
  previewRef: React.RefObject<HTMLDivElement | null>;
  setLoading: (loading: boolean) => void;
  loading: boolean;
  // Add other necessary props if they are used by the logic below
  // For now, keeping it simple as html2canvas captures the whole previewRef
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  console.log("Download triggered:", fileName);
}

export function MobileDownloadButton({
  mode,
  previewRef,
  setLoading,
  loading,
}: MobileDownloadButtonProps) {
  const [isDownloadingMobile, setIsDownloadingMobile] = useState(false);

  const handleMobileDownload = async () => {
    setIsDownloadingMobile(true);
    setLoading(true); 
    console.log("Mobile download started. Mode:", mode);

    try {
      const previewElement = previewRef.current;
      if (!previewElement) {
        console.error("Preview reference not available for mobile download.");
        setIsDownloadingMobile(false);
        setLoading(false);
        return;
      }

      console.log("Attempting html2canvas capture for mobile (scale: 1)...");
      const capturedCanvas = await html2canvas(previewElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 1, // Minimal scale for mobile
        logging: true, 
        imageTimeout: 15000, 
      });
      console.log("html2canvas capture complete for mobile. Captured canvas:", capturedCanvas.width, "x", capturedCanvas.height);

      const fileName = `porty-${mode}-mobile-${Date.now()}.png`;

      // For both PFP and Banner on mobile, use the capturedCanvas directly.
      // This means the downloaded image will have the exact pixel dimensions of the preview element on screen.
      // This is a compromise for reliability on mobile.
      console.log(`Creating blob for mobile ${mode} directly from captured canvas.`);
      const finalBlob = await new Promise<Blob>((resolve, reject) => {
        capturedCanvas.toBlob(b => {
          if (b) {
            console.log(`Mobile ${mode} blob created, size:`, b.size);
            resolve(b);
          } else {
            console.error(`Captured canvas toBlob failed for mobile ${mode} (blob is null)`);
            reject(new Error(`Captured canvas toBlob failed for mobile ${mode}`));
          }
        }, 'image/png');
      });
      
      triggerDownload(finalBlob, fileName);

    } catch (error) {
      console.error('Error downloading image on mobile:', error);
    } finally {
      setIsDownloadingMobile(false);
      setLoading(false);
      console.log("Mobile download process finished.");
    }
  };

  return (
    <Button onClick={handleMobileDownload} disabled={isDownloadingMobile || loading}> 
      {isDownloadingMobile ? (
        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>Processing...</>
      ) : (
        <><Download className="w-4 h-4 mr-2" />Download</>
      )}
    </Button>
  );
} 