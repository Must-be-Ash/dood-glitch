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

    try {
      const previewElement = previewRef.current;
      if (!previewElement) {
        console.error("Preview reference not available for mobile download.");
        setIsDownloadingMobile(false);
        setLoading(false);
        return;
      }

      const capturedCanvas = await html2canvas(previewElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 1, // Key change: Reduced scale for mobile
      });

      let finalBlob: Blob;
      const fileName = `porty-${mode}-mobile-${Date.now()}.png`;

      if (mode === 'banner') {
        const targetDownloadWidth = 1500; 
        const targetDownloadHeight = 500; 
        
        const outputCanvas = document.createElement('canvas');
        // For mobile, let's try outputting at 1x of target to reduce processing
        outputCanvas.width = targetDownloadWidth; 
        outputCanvas.height = targetDownloadHeight;
        
        const ctx = outputCanvas.getContext('2d');
        if (!ctx) throw new Error("Failed to get output canvas context for mobile banner");

        ctx.drawImage(capturedCanvas, 0, 0, outputCanvas.width, outputCanvas.height);

        finalBlob = await new Promise<Blob>((resolve, reject) => {
          outputCanvas.toBlob(b => b ? resolve(b) : reject(new Error("Final canvas toBlob failed for mobile banner")), 'image/png');
        });
      } else { // PFP mode
        // For PFP, the capturedCanvas (at 1x scale of preview) is used directly.
        // If preview is, say, 400x400, capturedCanvas will be 400x400.
        finalBlob = await new Promise<Blob>((resolve, reject) => {
          capturedCanvas.toBlob(b => b ? resolve(b) : reject(new Error("Captured canvas toBlob failed for mobile PFP")), 'image/png');
        });
      }
      triggerDownload(finalBlob, fileName);

    } catch (error) {
      console.error('Error downloading image on mobile:', error);
    } finally {
      setIsDownloadingMobile(false);
      setLoading(false);
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