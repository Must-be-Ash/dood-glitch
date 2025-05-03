"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Upload, Download, Zap, Layers, ScanLine, Tv, Loader2, Play, Pause } from "lucide-react"

export function GlitchAnimator() {
  const [image1, setImage1] = useState<string | null>("/light.jpeg")
  const [image2, setImage2] = useState<string | null>("/dark.jpeg")
  const [isGenerating, setIsGenerating] = useState(false)
  const [glitchIntensity, setGlitchIntensity] = useState(50)
  const [frameCount, setFrameCount] = useState(10)
  const [glitchSpeed, setGlitchSpeed] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)

  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)
  const image1Ref = useRef<HTMLImageElement>(null)
  const image2Ref = useRef<HTMLImageElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

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
    // Start playing the animation
    setIsPlaying(true)
    
    // Scroll to the preview section
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

    // Control animation speed
    if (timestamp - lastFrameTimeRef.current < glitchSpeed) {
      animationFrameRef.current = requestAnimationFrame(animate)
      return
    }
    lastFrameTimeRef.current = timestamp

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

      // STEP 1: Draw first image as base - maintaining aspect ratio
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img1, 0, 0, canvas.width, canvas.height)

      // Store the base layer for reference
      const baseLayer = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // STEP 2: Second image with cutouts revealing base image
      const secondLayer = document.createElement('canvas')
      secondLayer.width = canvas.width
      secondLayer.height = canvas.height
      const secondCtx = secondLayer.getContext('2d', { willReadFrequently: true })
      if (secondCtx) {
        // Draw second image
        secondCtx.drawImage(img2, 0, 0, canvas.width, canvas.height)
        
        // Create random holes in the second layer (4-7 holes)
        secondCtx.globalCompositeOperation = 'destination-out'
        const holeCount = 4 + Math.floor(Math.random() * 4)
        
        for (let h = 0; h < holeCount; h++) {
          // Create random sized and positioned rounded rectangles with maximum limits
          const maxWidth = Math.min(canvas.width * 0.3, 150) // Max 30% of width or 150px
          const maxHeight = Math.min(canvas.height * 0.3, 120) // Max 30% of height or 120px
          const rectWidth = 30 + Math.random() * (maxWidth - 30) // Between 30px and max
          const rectHeight = 20 + Math.random() * (maxHeight - 20) // Between 20px and max
          const x = Math.random() * (canvas.width - rectWidth)
          const y = Math.random() * (canvas.height - rectHeight)
          const cornerRadius = Math.min(rectWidth, rectHeight) * 0.3
          
          // Draw rounded rectangle hole
          secondCtx.beginPath()
          secondCtx.moveTo(x + cornerRadius, y)
          secondCtx.lineTo(x + rectWidth - cornerRadius, y)
          secondCtx.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + cornerRadius)
          secondCtx.lineTo(x + rectWidth, y + rectHeight - cornerRadius)
          secondCtx.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - cornerRadius, y + rectHeight)
          secondCtx.lineTo(x + cornerRadius, y + rectHeight)
          secondCtx.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - cornerRadius)
          secondCtx.lineTo(x, y + cornerRadius)
          secondCtx.quadraticCurveTo(x, y, x + cornerRadius, y)
          secondCtx.closePath()
          secondCtx.fill()
        }
        
        // Draw second layer with holes onto main canvas
        ctx.drawImage(secondLayer, 0, 0)
      }
      secondLayer.remove()
      
      // Store the combined layers 1+2 for reference
      const combinedLayers = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      // STEP 3: TV test pattern glitch overlay with its own cutouts
      const intensity = glitchIntensity / 100
      const glitchLayer = document.createElement('canvas')
      glitchLayer.width = canvas.width
      glitchLayer.height = canvas.height
      const glitchCtx = glitchLayer.getContext('2d', { willReadFrequently: true })
      
      if (glitchCtx) {
        // Clear the glitch layer
        glitchCtx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Add random TV test pattern blocks - SMALLER SIZE, SLIGHTLY MORE, MORE RANDOM
        // Use a random factor to make their appearance more unpredictable
        const randomFactor = Math.random() < 0.3 ? 0 : 1 // 30% chance of no blocks at all
        const blockCount = randomFactor * (Math.floor(intensity * 2) + 2) // 2-4 blocks when they appear
        
        const tvColors = [
          'rgba(255,255,255,0.25)', // White - much more transparent (0.7 -> 0.25)
          'rgba(255,255,0,0.25)',   // Yellow - much more transparent
          'rgba(0,255,255,0.25)',   // Cyan - much more transparent
          'rgba(0,255,0,0.25)',     // Green - much more transparent
          'rgba(255,0,255,0.25)',   // Magenta - much more transparent
          'rgba(255,0,0,0.25)',     // Red - much more transparent
          'rgba(0,0,255,0.25)'      // Blue - much more transparent
        ]
        
        for (let i = 0; i < blockCount; i++) {
          // SMALLER SIZES - max 20% of dimension instead of 35-45%
          const blockWidth = Math.floor(Math.random() * canvas.width * 0.2) + 25 // Smaller blocks
          const blockHeight = Math.floor(Math.random() * canvas.height * 0.15) + 20 // Smaller blocks
          
          // Position can be partially off-screen
          const blockX = Math.floor(Math.random() * canvas.width * 1.2) - canvas.width * 0.1
          const blockY = Math.floor(Math.random() * canvas.height * 1.2) - canvas.height * 0.1
          
          // Variable corner radius
          const cornerRadius = Math.min(blockWidth, blockHeight) * (0.2 + Math.random() * 0.3)
          
          // First, create a temporary canvas for this specific block with padding
          const blockCanvas = document.createElement('canvas')
          blockCanvas.width = blockWidth + 20 // Add padding for glitch effects
          blockCanvas.height = blockHeight + 20
          const blockCtx = blockCanvas.getContext('2d', { willReadFrequently: true })
          if (!blockCtx) continue
          
          // Clear block canvas
          blockCtx.clearRect(0, 0, blockCanvas.width, blockCanvas.height)
          
          // Draw the rounded rectangle with padding
          blockCtx.beginPath()
          const padding = 10
          blockCtx.moveTo(padding + cornerRadius, padding)
          blockCtx.lineTo(padding + blockWidth - cornerRadius, padding)
          blockCtx.quadraticCurveTo(padding + blockWidth, padding, padding + blockWidth, padding + cornerRadius)
          blockCtx.lineTo(padding + blockWidth, padding + blockHeight - cornerRadius)
          blockCtx.quadraticCurveTo(padding + blockWidth, padding + blockHeight, padding + blockWidth - cornerRadius, padding + blockHeight)
          blockCtx.lineTo(padding + cornerRadius, padding + blockHeight)
          blockCtx.quadraticCurveTo(padding, padding + blockHeight, padding, padding + blockHeight - cornerRadius)
          blockCtx.lineTo(padding, padding + cornerRadius)
          blockCtx.quadraticCurveTo(padding, padding, padding + cornerRadius, padding)
          blockCtx.closePath()
          blockCtx.clip()
          
          // Draw gradient color bars
          const numGradients = 3 + Math.floor(Math.random() * 3)
          const gradientHeight = blockHeight / numGradients
          const shuffledColors = [...tvColors].sort(() => Math.random() - 0.5)
          
          for (let j = 0; j < numGradients; j++) {
            // Get colors for gradient
            const colorIndex1 = j % shuffledColors.length
            const colorIndex2 = (j + 1) % shuffledColors.length
            
            const startY = padding + (j * gradientHeight)
            
            // Create linear gradient
            const gradient = blockCtx.createLinearGradient(
              padding, startY, 
              padding, startY + gradientHeight
            )
            
            // Parse colors for smoother transitions
            const color1 = shuffledColors[colorIndex1].replace('rgba(', '').replace(')', '').split(',')
            const color2 = shuffledColors[colorIndex2].replace('rgba(', '').replace(')', '').split(',')
            
            // Add gradient stops with multiple points
            gradient.addColorStop(0, shuffledColors[colorIndex1])
            
            // Add intermediate color stops
            for (let s = 0.2; s < 1; s += 0.2) {
              const r = Math.floor(parseInt(color1[0]) * (1 - s) + parseInt(color2[0]) * s)
              const g = Math.floor(parseInt(color1[1]) * (1 - s) + parseInt(color2[1]) * s)
              const b = Math.floor(parseInt(color1[2]) * (1 - s) + parseInt(color2[2]) * s)
              gradient.addColorStop(s, `rgba(${r},${g},${b},0.25)`) // More transparent (0.7 -> 0.25)
            }
            
            gradient.addColorStop(1, shuffledColors[colorIndex2])
            
            // Fill gradient
            blockCtx.fillStyle = gradient
            blockCtx.fillRect(0, startY, blockCanvas.width, gradientHeight)
          }
          
          // ALWAYS add glitch effects to EVERY block
          const shifts = 2 + Math.floor(Math.random() * 3) // 2-4 horizontal shifts per block
          
          for (let j = 0; j < shifts; j++) {
            const shiftY = padding + Math.floor(Math.random() * blockHeight)
            const shiftHeight = Math.min(blockHeight * 0.4, gradientHeight) * (0.5 + Math.random() * 0.5)
            
            // More random shift amounts for a more broken look
            const shiftAmount = Math.floor((Math.random() - 0.5) * 20) // -10 to 10 pixels
            
            // Only proceed if shift is significant
            if (Math.abs(shiftAmount) > 2) {
              // Get image data for the area to shift
              const shiftData = blockCtx.getImageData(0, shiftY, blockCanvas.width, shiftHeight)
              
              // Clear the original area
              blockCtx.clearRect(0, shiftY, blockCanvas.width, shiftHeight)
              
              // Draw the shifted data
              blockCtx.putImageData(shiftData, shiftAmount, shiftY)
            }
          }
          
          // Add subtle noise/static to the block
          const imageData = blockCtx.getImageData(0, 0, blockCanvas.width, blockCanvas.height)
    const data = imageData.data
          const noiseIntensity = intensity * 0.3
          
          for (let p = 0; p < data.length; p += 4) {
            if (data[p+3] > 0 && Math.random() < noiseIntensity) { // Only add noise to non-transparent pixels
              const noise = (Math.random() - 0.5) * 30
              data[p] = Math.min(255, Math.max(0, data[p] + noise))
              data[p+1] = Math.min(255, Math.max(0, data[p+1] + noise))
              data[p+2] = Math.min(255, Math.max(0, data[p+2] + noise))
            }
          }
          blockCtx.putImageData(imageData, 0, 0)
          
          // Occasionally add some vertical glitch artifacts
          if (Math.random() < 0.7) { // 70% chance for vertical artifacts
            const artifactX = Math.floor(Math.random() * blockWidth)
            const artifactWidth = 1 + Math.floor(Math.random() * 3) // 1-3 pixel wide artifacts
            
            blockCtx.globalCompositeOperation = 'screen'
            blockCtx.fillStyle = shuffledColors[Math.floor(Math.random() * shuffledColors.length)]
            blockCtx.fillRect(artifactX + padding, padding, artifactWidth, blockHeight)
          }
          
          // Draw the glitched block onto the main overlay
          glitchCtx.drawImage(blockCanvas, blockX - padding, blockY - padding)
          
          // Clean up the temporary block canvas
          blockCanvas.remove()
        }
        
        // Create a cutout canvas to make holes directly to layer 1
        const cutoutCanvas = document.createElement('canvas')
        cutoutCanvas.width = canvas.width
        cutoutCanvas.height = canvas.height
        const cutoutCtx = cutoutCanvas.getContext('2d', { willReadFrequently: true })
        
        if (cutoutCtx) {
          // Copy the glitch layer
          cutoutCtx.drawImage(glitchLayer, 0, 0)
          
          // Create direct cutouts to the first layer
          cutoutCtx.globalCompositeOperation = 'destination-out'
          
          // Add 2-4 cutouts
          const cutoutCount = 2 + Math.floor(Math.random() * 3)
          
          for (let i = 0; i < cutoutCount; i++) {
            const cutoutWidth = 30 + Math.random() * 120
            const cutoutHeight = 20 + Math.random() * 100
            const cutoutX = Math.random() * (canvas.width - cutoutWidth)
            const cutoutY = Math.random() * (canvas.height - cutoutHeight)
            const cutoutRadius = Math.min(cutoutWidth, cutoutHeight) * (0.2 + Math.random() * 0.3)
            
            cutoutCtx.beginPath()
            cutoutCtx.moveTo(cutoutX + cutoutRadius, cutoutY)
            cutoutCtx.lineTo(cutoutX + cutoutWidth - cutoutRadius, cutoutY)
            cutoutCtx.quadraticCurveTo(cutoutX + cutoutWidth, cutoutY, cutoutX + cutoutWidth, cutoutY + cutoutRadius)
            cutoutCtx.lineTo(cutoutX + cutoutWidth, cutoutY + cutoutHeight - cutoutRadius)
            cutoutCtx.quadraticCurveTo(cutoutX + cutoutWidth, cutoutY + cutoutHeight, cutoutX + cutoutWidth - cutoutRadius, cutoutY + cutoutHeight)
            cutoutCtx.lineTo(cutoutX + cutoutRadius, cutoutY + cutoutHeight)
            cutoutCtx.quadraticCurveTo(cutoutX, cutoutY + cutoutHeight, cutoutX, cutoutY + cutoutHeight - cutoutRadius)
            cutoutCtx.lineTo(cutoutX, cutoutY + cutoutRadius)
            cutoutCtx.quadraticCurveTo(cutoutX, cutoutY, cutoutX + cutoutRadius, cutoutY)
            cutoutCtx.closePath()
            cutoutCtx.fill()
          }
          
          // Restore the combined layers (layers 1+2)
          ctx.putImageData(combinedLayers, 0, 0)
          
          // Draw the glitch overlay with its cutouts
          ctx.drawImage(cutoutCanvas, 0, 0)
          
          // Cleanup
          cutoutCanvas.remove()
        }
        
        // Clean up
        glitchLayer.remove()
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

  // Start/stop preview animation
  useEffect(() => {
    if (image1 && image2 && isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [image1, image2, isPlaying, glitchIntensity, glitchSpeed])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative aspect-square flex items-center justify-center bg-black/10 dark:bg-white/5">
            {image1 ? (
              <div className="relative w-full h-full">
              <img
                ref={image1Ref}
                src={image1 || "/placeholder.svg"}
                alt="First image"
                  className="max-w-full max-h-full object-contain absolute inset-0 w-full h-full"
                />
                {/* Dark text overlay for light image with gradient background */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {/* Darker translucent overlay to improve text visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30"></div>
                  <span className="text-white font-extrabold text-lg drop-shadow-md relative z-10">UPLOAD</span>
                  <span className="text-white font-extrabold text-2xl md:text-3xl lg:text-4xl drop-shadow-md relative z-10 text-center tracking-wide">RAINBOW DOOD</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <Upload className="w-12 h-12 mb-4 text-gray-400" />
                <p className="text-center text-gray-500">Upload first image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage1Upload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
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
                src={image2 || "/placeholder.svg"}
                alt="Second image"
                  className="max-w-full max-h-full object-contain absolute inset-0 w-full h-full"
                />
                {/* White text overlay for dark image with gradient background */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {/* Lighter translucent overlay to improve text visibility */}
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage2Upload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" /> Glitch Intensity
            </label>
            <span className="text-sm text-gray-500">{glitchIntensity}%</span>
          </div>
          <Slider
            value={[glitchIntensity]}
            min={10}
            max={100}
            step={1}
            onValueChange={(value) => setGlitchIntensity(value[0])}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Layers className="w-4 h-4" /> Frame Count
            </label>
            <span className="text-sm text-gray-500">{frameCount} frames</span>
          </div>
          <Slider value={[frameCount]} min={6} max={24} step={2} onValueChange={(value) => setFrameCount(value[0])} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <ScanLine className="w-4 h-4" /> Animation Speed
            </label>
            <span className="text-sm text-gray-500">{glitchSpeed}ms</span>
          </div>
          <Slider
            value={[glitchSpeed]}
            min={50}
            max={300}
            step={10}
            onValueChange={(value) => setGlitchSpeed(value[0])}
          />
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <Button
          onClick={scrollToPreview}
          disabled={!image1 || !image2}
          className="w-full md:w-auto"
          size="lg"
        >
              <Tv className="mr-2 h-4 w-4" />
          Show Glitch Animation
        </Button>
      </div>

      {image1 && image2 && (
        <div className="mb-8" ref={previewRef}>
          <div className="relative aspect-square w-full max-w-2xl mx-auto overflow-hidden rounded-lg bg-black/10">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full object-contain"
            />
            <Button
              className="absolute bottom-4 right-4"
              onClick={() => setIsPlaying(!isPlaying)}
              size="icon"
              variant="secondary"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
            </div>
        </div>
      )}
    </div>
  )
}
