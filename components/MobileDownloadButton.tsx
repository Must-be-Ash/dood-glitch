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
        console.error("Preview reference not available");
        return;
      }

      // Get the preview element's dimensions
      const rect = previewElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // For PFP mode, we want a square output
      const outputSize = mode === 'pfp' ? Math.max(width, height) : width;
      const scale = mode === 'pfp' ? 2 : 1; // Higher scale for PFP for better quality

      // Temporarily adjust preview element for capture
      const originalStyle = previewElement.style.cssText;
      if (mode === 'pfp') {
        // Center the content for PFP mode
        previewElement.style.display = 'flex';
        previewElement.style.alignItems = 'center';
        previewElement.style.justifyContent = 'center';
      }

      const capturedCanvas = await html2canvas(previewElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: outputSize,
        height: mode === 'pfp' ? outputSize : height,
        scale: scale,
        logging: false,
        onclone: (clonedDoc, element) => {
          // Ensure the cloned element maintains the same dimensions
          element.style.width = `${outputSize}px`;
          if (mode === 'pfp') {
            element.style.height = `${outputSize}px`;
          }
        }
      });

      // Restore original style
      previewElement.style.cssText = originalStyle;

      // Create a new canvas for the final output
      const finalCanvas = document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set final canvas dimensions
      finalCanvas.width = mode === 'pfp' ? 1000 : 1500; // Standard sizes
      finalCanvas.height = mode === 'pfp' ? 1000 : 500;

      // Draw the captured content onto the final canvas
      ctx.drawImage(
        capturedCanvas,
        0, 0, capturedCanvas.width, capturedCanvas.height,
        0, 0, finalCanvas.width, finalCanvas.height
      );

      const finalBlob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob conversion failed'));
          },
          'image/png',
          1.0
        );
      });

      triggerDownload(finalBlob, `porty-${mode}-mobile-${Date.now()}.png`);

    } catch (error) {
      console.error('Error in mobile download:', error);
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