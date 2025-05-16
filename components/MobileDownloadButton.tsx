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

      console.log("Attempting html2canvas capture for mobile...");
      const capturedCanvas = await html2canvas(previewElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 1, // Keep scale at 1 for mobile to minimize processing
        logging: true, // Enable html2canvas logging for more insight
        imageTimeout: 15000, // Increase timeout for image loading within html2canvas
      });
      console.log("html2canvas capture complete for mobile. Captured canvas:", capturedCanvas.width, "x", capturedCanvas.height);

      let finalBlob: Blob;
      const fileName = `porty-${mode}-mobile-${Date.now()}.png`;

      if (mode === 'banner') {
        const targetWidth = 1200; // Reduced target width for mobile banner
        const targetHeight = 400; // Reduced target height (3:1)

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = targetWidth; 
        outputCanvas.height = targetHeight;
        
        const ctx = outputCanvas.getContext('2d');
        if (!ctx) {
          console.error("Failed to get output canvas context for mobile banner");
          throw new Error("Failed to get output canvas context for mobile banner");
        }
        console.log("Drawing captured mobile banner to output canvas:", outputCanvas.width, "x", outputCanvas.height);
        ctx.drawImage(capturedCanvas, 0, 0, outputCanvas.width, outputCanvas.height);

        finalBlob = await new Promise<Blob>((resolve, reject) => {
          outputCanvas.toBlob(b => {
            if (b) {
              console.log("Mobile banner blob created, size:", b.size);
              resolve(b);
            } else {
              console.error("Final canvas toBlob failed for mobile banner (blob is null)");
              reject(new Error("Final canvas toBlob failed for mobile banner"));
            }
          }, 'image/png');
        });
      } else { // PFP mode
        console.log("Creating blob for mobile PFP directly from captured canvas.");
        finalBlob = await new Promise<Blob>((resolve, reject) => {
          capturedCanvas.toBlob(b => {
            if (b) {
              console.log("Mobile PFP blob created, size:", b.size);
              resolve(b);
            } else {
              console.error("Captured canvas toBlob failed for mobile PFP (blob is null)");
              reject(new Error("Captured canvas toBlob failed for mobile PFP"));
            }
          }, 'image/png');
        });
      }
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