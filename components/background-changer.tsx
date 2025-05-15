'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Upload, X, Download, Image as ImageIcon, Rows, ZoomIn } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import html2canvas from 'html2canvas';

// Helper function to load an image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous"; // Needed for use in canvas if src is from different origin or blob
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

// Helper function for object-cover drawing logic
function drawObjectCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, targetWidth: number, targetHeight: number) {
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;
  const imgRatio = imgWidth / imgHeight;
  const targetRatio = targetWidth / targetHeight;

  let sx = 0, sy = 0, sWidth = imgWidth, sHeight = imgHeight;

  if (imgRatio > targetRatio) { // Image is wider than target, crop sides
    sWidth = imgHeight * targetRatio;
    sx = (imgWidth - sWidth) / 2;
  } else if (imgRatio < targetRatio) { // Image is taller than target, crop top/bottom
    sHeight = imgWidth / targetRatio;
    sy = (imgHeight - sHeight) / 2;
  }
  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
}

// Helper function to trigger download
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

// These would be your actual background images
const DEFAULT_BACKGROUNDS = [
  // Solid Colors
  { name: 'Blue', src: '/bg/blue.png', category: 'Solid Colors' },
  { name: 'Gray', src: '/bg/gray.png', category: 'Solid Colors' },
  { name: 'Green', src: '/bg/green.png', category: 'Solid Colors' },
  { name: 'Orange', src: '/bg/orange.png', category: 'Solid Colors' },
  { name: 'Pink', src: '/bg/pink.png', category: 'Solid Colors' },
  { name: 'Purple', src: '/bg/purple.png', category: 'Solid Colors' },
  { name: 'Yellow', src: '/bg/yellow.png', category: 'Solid Colors' },
  
  // Gradients
  { name: 'Blue-Green', src: '/bg/b-g.png', category: 'Gradients' },
  { name: 'Green-Yellow', src: '/bg/g-y.png', category: 'Gradients' },
  { name: 'Orange-Yellow', src: '/bg/o-y.png', category: 'Gradients' },
  { name: 'Purple-Blue', src: '/bg/p-b.png', category: 'Gradients' },
  { name: 'Purple-Yellow', src: '/bg/p-y.png', category: 'Gradients' },
  
  // Special Effects
  { name: 'Addi', src: '/bg/addi.png', category: 'Special Effects' },
  { name: 'Cube', src: '/bg/cube.png', category: 'Special Effects' },
  { name: 'Halo', src: '/bg/halo.png', category: 'Special Effects' },
  { name: 'Light 1', src: '/bg/light1.png', category: 'Special Effects' },
  { name: 'Light 2', src: '/bg/light2.png', category: 'Special Effects' },
  
  // Dynamic
  { name: 'Button', src: '/bg/button.png', category: 'Dynamic' },
  { name: 'Jump', src: '/bg/jump.png', category: 'Dynamic' },
  { name: 'Launch', src: '/bg/launch.png', category: 'Dynamic' },
  { name: 'LOF', src: '/bg/lof.png', category: 'Dynamic' },
  { name: 'Moon', src: '/bg/moon.png', category: 'Dynamic' },
  { name: 'Rocker', src: '/bg/rocker.png', category: 'Dynamic' },
  { name: 'Sky', src: '/bg/sky.png', category: 'Dynamic' },
];

export function BackgroundChanger() {
  const previewRef = useRef<HTMLDivElement>(null);
  const foregroundRef = useRef<HTMLDivElement>(null); // Ref for the foreground wrapper
  const [mode, setMode] = useState<'pfp' | 'banner'>('pfp');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [removedBgImage, setRemovedBgImage] = useState<string | null>(null);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [backgroundYOffset, setBackgroundYOffset] = useState(50); // 0-100, default 50 (center)
  const [isBgVerticallyScrollable, setIsBgVerticallyScrollable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [pfpScale, setPfpScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const initialPinchDistance = useRef<number | null>(null); // For pinch-to-zoom
  
  useEffect(() => {
    if (mode === 'banner' && selectedBackground) {
      loadImage(selectedBackground).then(img => {
        const imgAR = img.naturalWidth / img.naturalHeight;
        const bannerAR = 1500 / 500; // 3:1
        setIsBgVerticallyScrollable(imgAR < bannerAR);
      }).catch(() => setIsBgVerticallyScrollable(false));
    } else {
      setIsBgVerticallyScrollable(false);
    }
    // Reset scales when mode changes
    setScale(1);
    setPfpScale(1);
    setPosition({ x:0, y:0 });
  }, [mode, selectedBackground]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    
    const img = new window.Image();
    img.onload = () => {
      setOriginalImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.src = URL.createObjectURL(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process image');

      const blob = await response.blob();
      const processedImageUrl = URL.createObjectURL(blob);
      setRemovedBgImage(processedImageUrl);
      if (DEFAULT_BACKGROUNDS.length > 0) {
        setSelectedBackground(DEFAULT_BACKGROUNDS[0].src);
      }
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setCustomBackground(result);
      setSelectedBackground(result);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging only on the foreground element, not the entire preview container if mode is banner
    if (mode === 'banner' && foregroundRef.current && foregroundRef.current.contains(e.target as Node)) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode === 'banner' && isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    initialPinchDistance.current = null; // Reset for pinch
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mode === 'banner' && foregroundRef.current && foregroundRef.current.contains(e.target as Node)) {
      if (e.touches.length === 1) {
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
      } else if (e.touches.length === 2) {
        e.preventDefault(); // Prevent page zoom
        initialPinchDistance.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (mode === 'banner') {
      if (isDragging && e.touches.length === 1) {
        setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
      } else if (e.touches.length === 2 && initialPinchDistance.current !== null) {
        e.preventDefault(); // Prevent page zoom
        const currentPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const newScale = scale * (currentPinchDistance / initialPinchDistance.current);
        setScale(Math.max(0.1, Math.min(5, newScale)));
        initialPinchDistance.current = currentPinchDistance; // Update for continuous scaling
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialPinchDistance.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mode === 'banner' && previewRef.current && foregroundRef.current && foregroundRef.current.contains(e.target as Node)) {
      e.preventDefault();
      const newScale = scale + (e.deltaY > 0 ? -0.1 : 0.1);
      setScale(Math.max(0.1, Math.min(5, newScale)));
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const previewElement = previewRef.current;
      const fgElement = foregroundRef.current; // Renamed for clarity within this function scope

      if (!previewElement || (mode === 'banner' && !fgElement)) {
        console.error("Preview or foreground reference not available for download.");
        setLoading(false);
        return;
      }

      if (mode === 'banner') {
        if (!selectedBackground || !removedBgImage || !fgElement) {
          console.error("Background or foreground image not selected for banner.");
          setLoading(false);
          return;
        }

        const targetDownloadWidth = 1500;
        const targetDownloadHeight = 500;
        const outputScaleFactor = 2; // For 2x resolution output (3000x1000)

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = targetDownloadWidth * outputScaleFactor;
        outputCanvas.height = targetDownloadHeight * outputScaleFactor;
        const ctx = outputCanvas.getContext('2d');
        if (!ctx) throw new Error("Failed to get output canvas context");

        // 1. Draw Background Manually and Precisely
        const bgImg = await loadImage(selectedBackground);
        const imgOriginalWidth = bgImg.naturalWidth;
        const imgOriginalHeight = bgImg.naturalHeight;
        const imgAR = imgOriginalWidth / imgOriginalHeight;
        const canvasAR = targetDownloadWidth / targetDownloadHeight; // This is 3

        let bgDrawX = 0, bgDrawY = 0, bgScaledWidth = 0, bgScaledHeight = 0;

        if (imgAR >= canvasAR) { // Image is wider or same aspect ratio, scale by height
            bgScaledHeight = targetDownloadHeight;
            bgScaledWidth = bgScaledHeight * imgAR;
            bgDrawX = (targetDownloadWidth - bgScaledWidth) / 2; // Center horizontally
            bgDrawY = 0;
        } else { // Image is taller, scale by width, then apply Y offset
            bgScaledWidth = targetDownloadWidth;
            bgScaledHeight = bgScaledWidth / imgAR;
            bgDrawX = 0;
            const excessHeight = bgScaledHeight - targetDownloadHeight;
            if (excessHeight <= 0) { // Should not happen if imgAR < canvasAR but good check
                bgDrawY = (targetDownloadHeight - bgScaledHeight) / 2; // Center if not actually taller
            } else {
                bgDrawY = - (excessHeight * (backgroundYOffset / 100));
            }
        }
        // Draw onto the output canvas, scaled by outputScaleFactor
        ctx.drawImage(bgImg, 0, 0, imgOriginalWidth, imgOriginalHeight, 
                      bgDrawX * outputScaleFactor, bgDrawY * outputScaleFactor, 
                      bgScaledWidth * outputScaleFactor, bgScaledHeight * outputScaleFactor);

        // 2. Capture Foreground with html2canvas and Draw it
        const originalFgStyle = fgElement.style.backgroundColor;
        fgElement.style.backgroundColor = 'transparent'; // Ensure transparent capture
        
        const fgCanvas = await html2canvas(fgElement, {
          backgroundColor: null,
          useCORS: true,
          scale: outputScaleFactor, // Match output canvas scale factor
        });
        fgElement.style.backgroundColor = originalFgStyle; // Restore original color

        const previewRect = previewElement.getBoundingClientRect();
        const fgRect = fgElement.getBoundingClientRect();
        
        const fgLeftInPreview = fgRect.left - previewRect.left;
        const fgTopInPreview = fgRect.top - previewRect.top;
        
        const drawX = (fgLeftInPreview / previewRect.width) * outputCanvas.width;
        const drawY = (fgTopInPreview / previewRect.height) * outputCanvas.height;
        // The fgCanvas is already scaled by outputScaleFactor by html2canvas,
        // so we draw it at its captured size, but positioned proportionally.
        // We need to scale its *target draw size* on the outputCanvas based on preview proportion.
        const fgDrawWidth = (fgRect.width / previewRect.width) * outputCanvas.width;
        const fgDrawHeight = (fgRect.height / previewRect.height) * outputCanvas.height;

        ctx.drawImage(fgCanvas, 0,0, fgCanvas.width, fgCanvas.height, drawX, drawY, fgDrawWidth, fgDrawHeight );
        
        const finalBlob = await new Promise<Blob>((resolve, reject) => {
          outputCanvas.toBlob(b => b ? resolve(b) : reject(new Error("Final canvas toBlob failed for banner")), 'image/png');
        });
        triggerDownload(finalBlob, `porty-banner-${Date.now()}.png`);

      } else { // PFP mode: Use html2canvas for the whole preview
        const capturedCanvas = await html2canvas(previewElement, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          scale: 2, 
        });
        const finalBlob = await new Promise<Blob>((resolve, reject) => {
          capturedCanvas.toBlob(b => b ? resolve(b) : reject(new Error("Captured canvas toBlob failed for PFP")), 'image/png');
        });
        triggerDownload(finalBlob, `porty-pfp-${Date.now()}.png`);
      }

    } catch (error) { console.error('Error downloading image:', error); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-full space-y-8">
      {/* Image Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold">Upload Your Doodle</h3>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background/50 hover:bg-background/70 border-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG or GIF</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            {originalImage && (
              <div className="relative w-full aspect-square">
                <Image
                  src={originalImage}
                  alt="Original"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold">Upload Background (Optional)</h3>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background/50 hover:bg-background/70 border-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-8 h-8 mb-4 text-gray-500" />
                <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG or GIF</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleBackgroundUpload} />
            </label>
          </div>
        </Card>
      </div>

      {/* Background Library */}
      {removedBgImage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Background Library</h3>
          <Tabs defaultValue="all" className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="solid">Solid Colors</TabsTrigger>
              <TabsTrigger value="gradients">Gradients</TabsTrigger>
              <TabsTrigger value="effects">Special Effects</TabsTrigger>
              <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {DEFAULT_BACKGROUNDS.map((bg) => (
                  <BackgroundButton key={bg.src} background={bg} selected={selectedBackground === bg.src} onSelect={setSelectedBackground} />
                ))}
              </div>
            </TabsContent>
            
            {['Solid Colors', 'Gradients', 'Special Effects', 'Dynamic'].map((categoryName) => (
              <TabsContent key={categoryName} value={categoryName.toLowerCase().replace(" ", "")} className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {DEFAULT_BACKGROUNDS
                    .filter(bg => bg.category === categoryName)
                    .map((bg) => (
                      <BackgroundButton key={bg.src} background={bg} selected={selectedBackground === bg.src} onSelect={setSelectedBackground} />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}

      {/* Mode Toggle & Background Y Offset Slider */}
      {removedBgImage && selectedBackground && (
        <div className="space-y-4">
          <Tabs defaultValue="pfp" className="w-full" onValueChange={(value) => { setMode(value as 'pfp' | 'banner'); setBackgroundYOffset(50); setPfpScale(1); setScale(1); setPosition({x:0, y:0}); /* Reset on mode change */ }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pfp">Profile Picture</TabsTrigger>
              <TabsTrigger value="banner">Banner</TabsTrigger>
            </TabsList>
          </Tabs>
          {mode === 'banner' && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="bg-y-offset" className="text-sm font-medium flex items-center gap-2">
                    <Rows className="w-4 h-4" /> Background Vertical Position
                  </label>
                  <span className="text-sm text-muted-foreground">{backgroundYOffset}%</span>
                </div>
                <Slider
                  id="bg-y-offset"
                  value={[backgroundYOffset]}
                  onValueChange={(value) => setBackgroundYOffset(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  disabled={!isBgVerticallyScrollable}
                />
                 {!isBgVerticallyScrollable && <p className="text-xs text-muted-foreground text-center">This background fits perfectly, no vertical adjustment needed.</p>}
              </div>
            </Card>
          )}
          {mode === 'pfp' && (
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="pfp-scale" className="text-sm font-medium flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" /> Character Size
                  </label>
                  <span className="text-sm text-muted-foreground">{Math.round(pfpScale * 100)}%</span>
                </div>
                <Slider
                  id="pfp-scale"
                  value={[pfpScale]}
                  onValueChange={(value) => setPfpScale(value[0])}
                  min={0.5} max={2} step={0.01}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Preview Section */}
      {removedBgImage && selectedBackground && (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold">Preview & Adjust</h3>
            <div 
              ref={previewRef}
              className={`relative overflow-hidden bg-gray-700 touch-none select-none ${
                mode === 'pfp' ? 'w-full aspect-square' 
                                : 'w-full max-w-[1500px] mx-auto aspect-[3/1]'
              }`}
              onMouseDown={handleMouseDown} 
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel} 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              style={{ cursor: mode === 'banner' && isDragging ? 'grabbing' : (mode === 'banner' ? 'grab' : 'default') }}
            >
              <div className="absolute inset-0">
                <Image
                  src={selectedBackground}
                  alt="Background"
                  fill
                  className="object-cover"
                  style={{ objectPosition: mode === 'banner' ? `center ${backgroundYOffset}%` : 'center center'}}
                  unoptimized
                  priority 
                />
              </div>
              <div
                ref={foregroundRef} 
                className={`absolute ${mode === 'pfp' ? 'w-full h-full flex items-center justify-center' : ''}`}
                style={{
                  transform: mode === 'banner' ? `translate(${position.x}px, ${position.y}px) scale(${scale})` 
                             : (mode === 'pfp' ? `scale(${pfpScale})` : 'none'),
                  transition: isDragging ? 'none' : 'transform 0.1s',
                  pointerEvents: mode === 'banner' ? 'auto' : 'none',
                  width: (mode === 'banner' || (mode ==='pfp' && !originalImageDimensions)) ? '300px' : (originalImageDimensions ? `${originalImageDimensions.width}px` : '300px'),
                  height: (mode === 'banner' || (mode ==='pfp' && !originalImageDimensions)) ? '300px' : (originalImageDimensions ? `${originalImageDimensions.height}px` : '300px'),
                }}
              >
                <Image
                  src={removedBgImage}
                  alt="Your character"
                  width={mode === 'pfp' && originalImageDimensions ? originalImageDimensions.width : 300}
                  height={mode === 'pfp' && originalImageDimensions ? originalImageDimensions.height : 300}
                  className={`pointer-events-none ${mode === 'pfp' ? 'object-contain max-w-full max-h-full' : 'object-contain'}`}
                  unoptimized
                  priority 
                />
              </div>
            </div>
            <div className="flex gap-4">
              {mode === 'banner' && (
                <Button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); setBackgroundYOffset(50);}}>
                  Reset Position
                </Button>
              )}
              {mode === 'pfp' && (
                <Button onClick={() => { setPfpScale(1);}}>
                  Reset Size
                </Button>
              )}
              <Button onClick={handleDownload} disabled={loading}>
                {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>Downloading...</>) : (<><Download className="w-4 h-4 mr-2" />Download</>)}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && (<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="bg-background p-8 rounded-lg flex items-center gap-4 shadow-2xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div><span className="text-lg">Processing image...</span></div></div>)}
    </div>
  );
}

function BackgroundButton({ 
  background, 
  selected, 
  onSelect 
}: { 
  background: typeof DEFAULT_BACKGROUNDS[0], 
  selected: boolean, 
  onSelect: (src: string) => void 
}) {
  return (
    <button
      onClick={() => onSelect(background.src)}
      className={`group relative aspect-video w-full rounded-lg overflow-hidden border-2 transition-all duration-200 ease-in-out ${
        selected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-gray-700 hover:border-primary/70'
      }`}
      title={background.name}
    >
      <Image
        src={background.src}
        alt={background.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-200 ease-in-out"
        unoptimized
      />
      <div className={`absolute inset-0 flex items-end justify-start p-1.5 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-200 ease-in-out ${
        selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <span className="text-xs text-white font-medium truncate">{background.name}</span>
      </div>
    </button>
  );
} 