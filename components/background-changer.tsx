'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import html2canvas from 'html2canvas';

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
  const [mode, setMode] = useState<'pfp' | 'banner'>('pfp');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [removedBgImage, setRemovedBgImage] = useState<string | null>(null);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    
    // Get original image dimensions
    const img = new window.Image();
    img.onload = () => {
      setOriginalImageDimensions({
        width: img.width,
        height: img.height
      });
    };
    img.src = URL.createObjectURL(file);

    // Display original image
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process image to remove background
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
      setSelectedBackground(DEFAULT_BACKGROUNDS[0].src); // Set default background
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
    if (mode === 'banner') {
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
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mode === 'banner') {
      e.preventDefault();
      const newScale = scale + (e.deltaY > 0 ? -0.1 : 0.1);
      setScale(Math.max(0.5, Math.min(3, newScale)));
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    
    try {
      setLoading(true);
      
      // Create canvas from the preview div
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // Higher quality
      });

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b: Blob | null) => {
          if (b) resolve(b);
        }, 'image/png');
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `porty-${mode}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setLoading(false);
    }
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="solid">Solid Colors</TabsTrigger>
              <TabsTrigger value="gradients">Gradients</TabsTrigger>
              <TabsTrigger value="effects">Special Effects</TabsTrigger>
              <TabsTrigger value="dynamic">Dynamic</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {DEFAULT_BACKGROUNDS.map((bg) => (
                  <BackgroundButton key={bg.src} background={bg} selected={selectedBackground === bg.src} onSelect={setSelectedBackground} />
                ))}
              </div>
            </TabsContent>
            
            {['solid', 'gradients', 'effects', 'dynamic'].map((category) => (
              <TabsContent key={category} value={category} className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {DEFAULT_BACKGROUNDS
                    .filter(bg => bg.category.toLowerCase().includes(category.replace('solid', 'solid colors')))
                    .map((bg) => (
                      <BackgroundButton key={bg.src} background={bg} selected={selectedBackground === bg.src} onSelect={setSelectedBackground} />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      )}

      {/* Mode Toggle */}
      {removedBgImage && selectedBackground && (
        <Tabs defaultValue="pfp" className="w-full" onValueChange={(value) => setMode(value as 'pfp' | 'banner')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pfp">Profile Picture</TabsTrigger>
            <TabsTrigger value="banner">Banner</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Preview Section */}
      {removedBgImage && selectedBackground && (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-semibold">Preview & Adjust</h3>
            <div 
              ref={previewRef}
              className={`relative overflow-hidden ${
                mode === 'pfp' ? 'w-full aspect-square' : 'w-full h-[500px]'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                width: mode === 'banner' ? '1500px' : '100%',
                maxWidth: '100%'
              }}
            >
              <div className="absolute inset-0">
                <Image
                  src={selectedBackground}
                  alt="Background"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div
                className="absolute"
                style={{
                  transform: mode === 'banner' 
                    ? `translate(${position.x}px, ${position.y}px) scale(${scale})`
                    : 'none',
                  cursor: mode === 'banner' ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  transition: isDragging ? 'none' : 'transform 0.1s',
                  ...(mode === 'pfp' && originalImageDimensions ? {
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  } : {})
                }}
              >
                <Image
                  src={removedBgImage}
                  alt="Your character"
                  width={mode === 'pfp' && originalImageDimensions ? originalImageDimensions.width : 300}
                  height={mode === 'pfp' && originalImageDimensions ? originalImageDimensions.height : 300}
                  className={`pointer-events-none ${mode === 'pfp' ? 'object-contain' : ''}`}
                  unoptimized
                />
              </div>
            </div>
            <div className="flex gap-4">
              {mode === 'banner' && (
                <Button onClick={() => {
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                }}>
                  Reset Position
                </Button>
              )}
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-background p-8 rounded-lg flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span>Processing image...</span>
          </div>
        </div>
      )}
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
      className={`relative aspect-video w-full rounded-lg overflow-hidden border-2 transition-all ${
        selected ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-transparent hover:border-primary/50'
      }`}
      title={background.name}
    >
      <Image
        src={background.src}
        alt={background.name}
        fill
        className="object-cover"
      />
      <div className={`absolute inset-0 flex items-end justify-start p-2 bg-gradient-to-t from-black/50 to-transparent transition-opacity ${
        selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <span className="text-xs text-white font-medium">{background.name}</span>
      </div>
    </button>
  );
} 