"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Upload, Zap, ScanLine, Loader2, Play, Pause, Download } from 'lucide-react'
import { recordElement, convertVideoToGif } from "../lib/screen-recorder"

export function DualImageAnimator() {
  const [image1, setImage1] = useState<string | null>("/light.jpeg")
  const [image2, setImage2] = useState<string | null>("/dark.jpeg")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)

  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)
  const image1Ref = useRef<HTMLImageElement>(null)
  const image2Ref = useRef<HTMLImageElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const glitchSequenceRef = useRef<number>(0)

  // Define the glitch sequence timing (in ms)
  const glitchSequence = [
    { image: 1, duration: 800 },  // Start with image1 (light)
    { image: 2, duration: 50 },   // Quick flash to image2
    { image: 1, duration: 200 },  // Back to image1
    { image: 2, duration: 100 },  // Longer flash of image2
    { image: 1, duration: 100 },  // Quick back to image1
    { image: 2, duration: 150 },  // Medium flash of image2
    { image: 1, duration: 50 },   // Very quick flash of image1
    { image: 2, duration: 300 },  // Hold image2
    { image: 1, duration: 30 },   // Extremely quick flash of image1
    { image: 2, duration: 500 },  // Final hold of image2
    { image: 1, duration: 1000 }, // Return to image1 and hold
  ]

  const handleImage1Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage1(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImage2Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage2(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const scrollToPreview = () => {
    setIsPlaying(true)
    setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const animate = (timestamp: number) => {
    if (!image1 || !image2 || !previewCanvasRef.current) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Calculate time in current sequence
    const timeSinceLastFrame = timestamp - lastFrameTimeRef.current
    const currentStep = glitchSequence[glitchSequenceRef.current]

    if (timeSinceLastFrame >= currentStep.duration) {
      // Move to next step in sequence
      glitchSequenceRef.current = (glitchSequenceRef.current + 1) % glitchSequence.length
      lastFrameTimeRef.current = timestamp

      // Add random glitch effect
      if (Math.random() < 0.3) { // 30% chance of adding glitch effect
        ctx.fillStyle = '#fff'
        const glitchHeight = Math.random() * 10
        const glitchY = Math.random() * canvas.height
        ctx.fillRect(0, glitchY, canvas.width, glitchHeight)
      }
    }

    // Load images
    const img1 = new Image()
    const img2 = new Image()
    img1.src = image1
    img2.src = image2

    const drawFrame = () => {
      // If first run, set canvas size to match first image aspect ratio
      if (img1.width > 0 && img1.height > 0 && (canvas.width !== img1.width || canvas.height !== img1.height)) {
        canvas.width = img1.width
        canvas.height = img1.height
      }

      // Draw the current image based on sequence
      const currentImage = currentStep.image === 1 ? img1 : img2
      
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height)

      // Add random RGB shift effect during transitions
      if (timeSinceLastFrame < 50) { // Only during first 50ms of transition
        const shift = Math.random() * 5
        ctx.drawImage(currentImage, shift, 0, canvas.width, canvas.height)
        ctx.globalCompositeOperation = 'screen'
        ctx.drawImage(currentImage, -shift, 0, canvas.width, canvas.height)
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    // Wait for images to load
    Promise.all([
      new Promise(resolve => { img1.onload = resolve }),
      new Promise(resolve => { img2.onload = resolve })
    ]).then(() => {
      drawFrame()
    })

    // Continue animation
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
  }

  useEffect(() => {
    if (image1 && image2 && isPlaying) {
      glitchSequenceRef.current = 0 // Reset sequence
      lastFrameTimeRef.current = performance.now() // Reset timer
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [image1, image2, isPlaying])

  const handleRecord = async () => {
    if (!previewCanvasRef.current) return;
    
    try {
      setIsRecording(true);
      setIsPlaying(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const videoBlob = await recordElement(previewCanvasRef.current);
      
      setConversionProgress(0);
      const gifBlob = await convertVideoToGif(videoBlob, (progress) => {
        setConversionProgress(progress);
      });
      
      const url = URL.createObjectURL(gifBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dual-image-animation.gif';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Failed to record:', err);
    } finally {
      setIsRecording(false);
      setConversionProgress(0);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative aspect-square flex items-center justify-center bg-black/10 dark:bg-white/5">
            {image1 ? (
              <div className="relative w-full h-full">
                <img
                  ref={image1Ref}
                  src={image1}
                  alt="First image"
                  className="max-w-full max-h-full object-contain absolute inset-0 w-full h-full"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30"></div>
                  <span className="text-white font-extrabold text-lg drop-shadow-md relative z-10">UPLOAD</span>
                  <span className="text-white font-extrabold text-2xl md:text-3xl lg:text-4xl drop-shadow-md relative z-10 text-center tracking-wide">
                    <span className="md:hidden">RAINBOW DOOD</span>
                    <span className="hidden md:inline">RAINBOW<br />DOOD</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                <p className="text-center text-gray-500">Upload first image</p>
              </div>
            )}
            {image1 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                onClick={() => setImage1(null)}
              >
                ×
              </Button>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImage1Upload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              style={{ zIndex: 1 }}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0 relative aspect-square flex items-center justify-center bg-black/10 dark:bg-white/5">
            {image2 ? (
              <div className="relative w-full h-full">
                <img
                  ref={image2Ref}
                  src={image2}
                  alt="Second image"
                  className="max-w-full max-h-full object-contain absolute inset-0 w-full h-full"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/10"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10"></div>
                  <span className="text-white font-extrabold text-lg drop-shadow-md relative z-10">UPLOAD</span>
                  <span className="text-white font-extrabold text-2xl md:text-3xl lg:text-4xl drop-shadow-md relative z-10 text-center tracking-wide">DARKMODE DOOD</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                <p className="text-center text-gray-500">Upload second image</p>
              </div>
            )}
            {image2 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                onClick={() => setImage2(null)}
              >
                ×
              </Button>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImage2Upload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              style={{ zIndex: 1 }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-12 mb-6">
        <Button
          onClick={scrollToPreview}
          disabled={!image1 || !image2}
          className="w-full md:w-auto"
          size="lg"
        >
          Show Animation
        </Button>
      </div>

      {image1 && image2 && (
        <div className="mb-8" ref={previewRef}>
          <div className="relative aspect-square w-full max-w-2xl mx-auto overflow-hidden rounded-lg bg-black/10">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                size="icon"
                variant="secondary"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button
                onClick={handleRecord}
                size="icon"
                variant="secondary"
                disabled={isRecording}
              >
                {isRecording ? (
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
                ) : (
                  <Download className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 