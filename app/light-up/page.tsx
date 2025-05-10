'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { GlitchText } from "@/components/glitch-text";
import { Footer } from "@/components/footer"
import { Download, Loader2 } from 'lucide-react';
import { recordElement, convertVideoToGif } from "@/lib/screen-recorder";
import { Label } from "@/components/ui/label";
import { DualImageAnimator } from "@/components/dual-image-animator";
import { ImageAnimator } from "@/components/thriple-image-animator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils"

interface AnimationFramesFromAPI {
  original: string;        // base64 data URL of transparent original
  grayscaleWithEyes: string; // base64 data URL of transparent grayscale with eyes
  silhouette: string;      // base64 data URL of transparent silhouette with eyes
}

// Animation sequence definition
interface AnimationStep {
  frameKey: keyof AnimationFramesFromAPI;
  backgroundColor: string;
  duration: number; // ms
  isSilhouetteFlash?: boolean; // Flag for fast flashing silhouette frames
}

// const originalPinkBg = '#FFC0CB'; // Will be fetched dynamically
const grayBg = '#CCCCCC';

// Function to generate the animation sequence dynamically
const createAnimationSequence = (dynamicOriginalBg: string): AnimationStep[] => [
  { frameKey: 'original', backgroundColor: dynamicOriginalBg, duration: 1000 },  
  { frameKey: 'grayscaleWithEyes', backgroundColor: grayBg, duration: 500 }, 
  { frameKey: 'silhouette', backgroundColor: dynamicOriginalBg, duration: 250 }, 
  { frameKey: 'grayscaleWithEyes', backgroundColor: grayBg, duration: 100 }, 
  { frameKey: 'silhouette', backgroundColor: dynamicOriginalBg, duration: 35, isSilhouetteFlash: true }, 
  { frameKey: 'silhouette', backgroundColor: '#83eec6', duration: 35, isSilhouetteFlash: true },
  { frameKey: 'silhouette', backgroundColor: '#fee793', duration: 35, isSilhouetteFlash: true },
  { frameKey: 'silhouette', backgroundColor: '#9bddfc', duration: 35, isSilhouetteFlash: true },
  { frameKey: 'silhouette', backgroundColor: dynamicOriginalBg, duration: 35, isSilhouetteFlash: true },
  { frameKey: 'silhouette', backgroundColor: '#83eec6', duration: 35, isSilhouetteFlash: true },
];

export default function LightUpPage() {
  const [apiFrames, setApiFrames] = useState<AnimationFramesFromAPI | null>(null);
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string | null>(null);
  const [currentBgColor, setCurrentBgColor] = useState('#FFC0CB'); // Default initial BG
  const [currentAnimationStep, setCurrentAnimationStep] = useState<AnimationStep | null>(null); // New state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepIndexRef = useRef(0);
  const [currentAnimationSequence, setCurrentAnimationSequence] = useState<AnimationStep[]>(createAnimationSequence('#FFC0CB'));
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationMode, setAnimationMode] = useState<'single' | 'dual' | 'triple'>('dual');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setApiFrames(null);
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    currentStepIndexRef.current = 0;
    setCurrentDisplayImage(null);
    setCurrentAnimationStep(null); // Reset current step

    const framesFormData = new FormData();
    framesFormData.append('image', file);

    const bgColorFormData = new FormData();
    bgColorFormData.append('image', file.slice()); 

    try {
      const [framesResponse, bgColorResponse] = await Promise.all([
        fetch('/api/animation-frames', {
          method: 'POST',
          body: framesFormData,
        }),
        fetch('/api/get-background-color', {
          method: 'POST',
          body: bgColorFormData,
        })
      ]);

      if (!framesResponse.ok) {
        const errorData = await framesResponse.json().catch(() => ({ error: 'Failed to generate frames' }));
        throw new Error(errorData.error || 'Frame generation failed');
      }
      if (!bgColorResponse.ok) {
        const errorData = await bgColorResponse.json().catch(() => ({ error: 'Failed to get background color' }));
        throw new Error(errorData.error || 'Background color fetch failed');
      }

      const framesData: AnimationFramesFromAPI = await framesResponse.json();
      const bgColorData = await bgColorResponse.json();
      
      const newOriginalBgColor = bgColorData.backgroundColorHex || '#FFC0CB';
      setCurrentAnimationSequence(createAnimationSequence(newOriginalBgColor));
      setApiFrames(framesData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!apiFrames) {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      setCurrentAnimationStep(null);
      return;
    }

    const playStep = (index: number) => {
      const currentIdx = index % currentAnimationSequence.length;
      const step = currentAnimationSequence[currentIdx];
      
      setCurrentAnimationStep(step);
      setCurrentDisplayImage(apiFrames[step.frameKey]);
      setCurrentBgColor(step.backgroundColor);

      // Update canvas content
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d', { alpha: true });
        if (ctx) {
          // Set canvas size to maintain quality
          canvasRef.current.width = 800;
          canvasRef.current.height = 800;
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Clear canvas
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw background
          ctx.fillStyle = step.backgroundColor;
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw image
          const img = new window.Image();
          img.onload = () => {
            // Calculate dimensions to maintain aspect ratio while filling the canvas
            const canvasAspect = canvasRef.current!.width / canvasRef.current!.height;
            const imgAspect = img.width / img.height;
            
            let targetWidth = canvasRef.current!.width;
            let targetHeight = canvasRef.current!.height;
            
            if (imgAspect > canvasAspect) {
              // Image is wider than canvas
              targetHeight = canvasRef.current!.width / imgAspect;
            } else {
              // Image is taller than canvas
              targetWidth = canvasRef.current!.height * imgAspect;
            }
            
            const x = (canvasRef.current!.width - targetWidth) / 2;
            const y = (canvasRef.current!.height - targetHeight) / 2;
            
            // Draw image to fill canvas
            ctx.drawImage(img, x, y, targetWidth, targetHeight);
          };
          img.src = apiFrames[step.frameKey];
        }
      }
      
      currentStepIndexRef.current = currentIdx + 1;
      animationTimeoutRef.current = setTimeout(() => playStep(currentStepIndexRef.current), step.duration);
    };

    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    
    if (apiFrames) {
      currentStepIndexRef.current = 0; 
      if (currentAnimationSequence.length > 0) {
        const firstStep = currentAnimationSequence[0];
        setCurrentAnimationStep(firstStep);
        setCurrentBgColor(firstStep.backgroundColor);
      }
      playStep(0); 
    }

    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, [apiFrames, currentAnimationSequence]);

  // Remove the resize effect since we want fixed dimensions for quality
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 800;
      canvasRef.current.height = 800;
    }
  }, []);

  const handleDownload = async () => {
    if (!apiFrames || !currentAnimationSequence || !canvasRef.current) return;
    
    setIsDownloading(true);
    setIsRecording(true);
    try {
      // Wait a moment for animation to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Record the canvas element
      const videoBlob = await recordElement(canvasRef.current, 3000); // Record for 3 seconds
      
      // Convert to GIF with progress
      setConversionProgress(0);
      const gifBlob = await convertVideoToGif(videoBlob, (progress) => {
        setConversionProgress(progress);
      });
      
      // Create download link
      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'light-up-animation.gif';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading animation:', error);
    } finally {
      setIsDownloading(false);
      setIsRecording(false);
      setConversionProgress(0);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-16 sm:pt-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between flex-1">
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <GlitchText 
              text="LightUp Doods" 
              className="text-4xl font-extrabold"
              speed={6}
              shimmerWidth={180}
            />
          </div>
          <p className="text-center mb-6">
            Upload your doodle and get a light up animation
          </p>

          <div className="flex flex-col items-center justify-center gap-4 mb-12">
            <div className="inline-flex p-1 bg-[#222222] rounded-lg border border-[#333333]">
              {[
                { value: 'single', label: 'OG' },
                { value: 'dual', label: 'DarkDood' },
                { value: 'triple', label: 'Triple' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setAnimationMode(option.value as 'single' | 'dual' | 'triple')}
                  className={cn(
                    "relative px-6 py-2 text-sm font-medium rounded-md transition-all duration-200",
                    animationMode === option.value
                      ? "bg-[#333333] text-white shadow-sm after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-white after:shadow-[0_0_8px_rgba(255,255,255,0.5)] after:rounded-full"
                      : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {animationMode === 'triple' ? (
            <ImageAnimator />
          ) : animationMode === 'dual' ? (
            <DualImageAnimator />
          ) : (
            <>
              <div className="mb-12 p-6 bg-[#222222] backdrop-blur-sm rounded-xl shadow-lg border border-[#333333]">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#333333] border-dashed rounded-lg cursor-pointer bg-[#333333]/30 hover:bg-[#333333]/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className="mb-2 text-sm text-gray-300">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                
                {isLoading && (
                  <div className="flex items-center justify-center mt-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <span className="ml-3 text-purple-400">Generating Animation Frames...</span>
                  </div>
                )}
                
                {error && (
                  <div className="mt-6 p-4 bg-red-900/50 text-red-300 rounded-lg border border-red-800">{error}</div>
                )}
              </div>

              {currentDisplayImage && (
                <div className="space-y-6">
                  <div 
                    className="relative w-full max-w-2xl mx-auto aspect-square rounded-lg shadow-xl overflow-hidden"
                  >
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className={`flex items-center gap-2 px-4 py-2 bg-[#333333] hover:bg-[#444444] rounded-lg transition-colors ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isDownloading ? (
                        <>
                          <div className="relative">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {conversionProgress > 0 && (
                              <div 
                                className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
                                style={{ color: conversionProgress >= 1 ? '#22c55e' : undefined }}
                              >
                                {Math.round(conversionProgress * 100)}%
                              </div>
                            )}
                          </div>
                          <span>Creating GIF...</span>
                        </>
                      ) : (
                        <>
                          <Download size={20} />
                          <span>Download Animation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className={`w-full ${currentDisplayImage || animationMode !== 'single' ? 'mt-32' : 'mt-16'}`}>
        <Footer />
      </div>
    </main>
  );
} 