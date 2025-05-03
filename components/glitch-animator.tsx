"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Upload, Download, Zap, Layers, ScanLine, Tv, Loader2 } from "lucide-react"

export function GlitchAnimator() {
  const [image1, setImage1] = useState<string | null>(null)
  const [image2, setImage2] = useState<string | null>(null)
  const [resultGif, setResultGif] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [glitchIntensity, setGlitchIntensity] = useState(50)
  const [frameCount, setFrameCount] = useState(10)
  const [glitchSpeed, setGlitchSpeed] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)
  const image1Ref = useRef<HTMLImageElement>(null)
  const image2Ref = useRef<HTMLImageElement>(null)

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

  const generateGlitchAnimation = async () => {
    if (!image1 || !image2 || !canvasRef.current) return

    setIsGenerating(true)
    setResultGif(null)

    try {
      // Dynamically import the GIF.js library
      const GIFModule = await import("gif.js")
      const GIF = GIFModule.default

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Load both images first
      const img1 = new Image()
      const img2 = new Image()
      
      await Promise.all([
        new Promise((resolve, reject) => {
          img1.onload = () => {
            console.log("Image 1 loaded:", img1.width, "x", img1.height)
            resolve(null)
          }
          img1.onerror = () => reject(new Error("Failed to load first image"))
          img1.src = image1
        }),
        new Promise((resolve, reject) => {
          img2.onload = () => {
            console.log("Image 2 loaded:", img2.width, "x", img2.height)
            resolve(null)
          }
          img2.onerror = () => reject(new Error("Failed to load second image"))
          img2.src = image2
        }),
      ])

      // Set canvas dimensions based on the first image to maintain its aspect ratio
      const width = img1.width
      const height = img1.height
      canvas.width = width
      canvas.height = height

      console.log("Canvas size:", width, "x", height)

      // Create a GIF encoder
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: width,
        height: height,
        workerScript: "/gif.worker.js",
        debug: true,
        repeat: 0,
        background: '#fff',
        transparent: null,
      })

      // Generate frames
      for (let i = 0; i < frameCount; i++) {
        console.log("Generating frame", i + 1, "of", frameCount)
        
        // Clear canvas with white background
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, width, height)

        // Draw the first image as base layer - maintaining aspect ratio
        ctx.drawImage(img1, 0, 0, width, height)

        // Create a temporary canvas for compositing
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
        if (!tempCtx) continue

        // Draw second image to temp canvas - scaled to match the first image dimensions
        tempCtx.drawImage(img2, 0, 0, width, height)

        // Create glitch mask with rounded rectangles
        const revealCount = 3 + Math.floor(Math.random() * 3)
        tempCtx.globalCompositeOperation = 'destination-out'
        
        for (let h = 0; h < revealCount; h++) {
          const x = Math.random() * width
          const y = Math.random() * height
          const rectWidth = 50 + Math.random() * 150
          const rectHeight = 40 + Math.random() * 100
          const cornerRadius = Math.min(rectWidth, rectHeight) * 0.3
          
          // Draw rounded rectangle
          tempCtx.beginPath()
          tempCtx.moveTo(x + cornerRadius, y)
          tempCtx.lineTo(x + rectWidth - cornerRadius, y)
          tempCtx.quadraticCurveTo(x + rectWidth, y, x + rectWidth, y + cornerRadius)
          tempCtx.lineTo(x + rectWidth, y + rectHeight - cornerRadius)
          tempCtx.quadraticCurveTo(x + rectWidth, y + rectHeight, x + rectWidth - cornerRadius, y + rectHeight)
          tempCtx.lineTo(x + cornerRadius, y + rectHeight)
          tempCtx.quadraticCurveTo(x, y + rectHeight, x, y + rectHeight - cornerRadius)
          tempCtx.lineTo(x, y + cornerRadius)
          tempCtx.quadraticCurveTo(x, y, x + cornerRadius, y)
          tempCtx.closePath()
          tempCtx.fill()
        }

        // Draw masked second image onto main canvas
        ctx.globalAlpha = 0.85
        ctx.drawImage(tempCanvas, 0, 0)
        ctx.globalAlpha = 1.0

        // Apply glitch effects - simplified to be less chaotic
        applyGlitchEffects(ctx, width, height, glitchIntensity / 100)

        // Create a new canvas for the final frame
        const frameCanvas = document.createElement('canvas')
        frameCanvas.width = width
        frameCanvas.height = height
        const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true })
        if (!frameCtx) continue

        // Copy the current frame to the new canvas
        frameCtx.drawImage(canvas, 0, 0)

        // Add frame to GIF
        gif.addFrame(frameCanvas, {
          delay: glitchSpeed,
          copy: true,
          dispose: 1
        })

        // Clean up temporary canvases
        tempCanvas.remove()
        frameCanvas.remove()

        console.log("Frame", i + 1, "added to GIF")
      }

      // Add finished handler before rendering
      gif.on('finished', function(blob) {
        console.log("GIF generation finished, blob size:", blob.size, "bytes")
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob)
          setResultGif(url)
          
          // Create download link
          const a = document.createElement('a')
          a.href = url
          a.download = 'glitch-animation.gif'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          
          // Cleanup
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        } else {
          console.error("Generated GIF has 0 bytes")
          setIsGenerating(false)
        }
      })

      // Add error handler
      gif.on('error', function(error) {
        console.error("GIF generation error:", error)
        setIsGenerating(false)
      })

      console.log("Starting GIF render...")
      gif.render()

    } catch (error) {
      console.error("Error in GIF generation:", error)
      setIsGenerating(false)
    }
  }

  const applyGlitchEffects = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    // Create a temporary canvas for the glitch overlay
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
    if (!tempCtx) return

    // Copy current state to temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0)

    // Get image data for manipulation
    const imageData = tempCtx.getImageData(0, 0, width, height)
    const data = imageData.data

    // RGB shift with increased intensity
    rgbShift(data, width, height, intensity * 1.5)

    // TV-like scan lines
    scanLines(data, width, height, intensity)

    // CRT-like noise
    addNoise(data, width, height, intensity)

    // Put the modified image data back to temp canvas
    tempCtx.putImageData(imageData, 0, 0)

    // Apply the glitch overlay with transparency
    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.drawImage(tempCanvas, 0, 0)
    ctx.restore()

    // Random colored blocks with TV-like distortion
    if (Math.random() < intensity * 0.9) {
      randomBlocks(ctx, width, height, intensity)
    }

    // Chromatic aberration effect
    if (Math.random() < intensity * 0.7) {
      chromaticAberration(ctx, width, height, intensity)
    }

    tempCanvas.remove()
  }

  const rgbShift = (data: Uint8ClampedArray, width: number, height: number, intensity: number) => {
    const shiftAmount = Math.floor(intensity * 10)
    if (shiftAmount === 0) return

    // Create a copy of the original data
    const originalData = new Uint8ClampedArray(data)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4

        // Shift red channel
        const rShift = Math.min(width - 1, Math.max(0, x + shiftAmount))
        const rIndex = (y * width + rShift) * 4
        data[i] = originalData[rIndex]

        // Shift blue channel
        const bShift = Math.min(width - 1, Math.max(0, x - shiftAmount))
        const bIndex = (y * width + bShift) * 4 + 2
        data[i + 2] = originalData[bIndex]
      }
    }
  }

  const scanLines = (data: Uint8ClampedArray, width: number, height: number, intensity: number) => {
    const lineFrequency = Math.max(2, Math.floor(15 - intensity * 10))
    const lineOpacity = intensity * 0.7

    for (let y = 0; y < height; y++) {
      if (y % lineFrequency === 0) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          
          // Create more pronounced scan lines
          const scanIntensity = Math.sin(y * 0.1) * 0.5 + 0.5
          const darkness = lineOpacity * scanIntensity

          // Darken the scan line
          data[i] = Math.floor(data[i] * (1 - darkness))
          data[i + 1] = Math.floor(data[i + 1] * (1 - darkness))
          data[i + 2] = Math.floor(data[i + 2] * (1 - darkness))
        }
      }
    }
  }

  const addNoise = (data: Uint8ClampedArray, width: number, height: number, intensity: number) => {
    const noiseAmount = intensity * 50

    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < intensity * 0.3) {
        const noise = (Math.random() - 0.5) * noiseAmount

        data[i] = Math.min(255, Math.max(0, data[i] + noise))
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise))
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise))
      }
    }
  }

  const randomBlocks = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    const blockCount = Math.floor(intensity * 12) // Reduced count for less chaos
    
    // TV test pattern color stripes - classic TV colors
    const tvColors = [
      'rgba(255,255,255,0.2)', // White
      'rgba(255,255,0,0.2)',   // Yellow
      'rgba(0,255,255,0.2)',   // Cyan
      'rgba(0,255,0,0.2)',     // Green
      'rgba(255,0,255,0.2)',   // Magenta
      'rgba(255,0,0,0.2)',     // Red
      'rgba(0,0,255,0.2)'      // Blue
    ]

    for (let i = 0; i < blockCount; i++) {
      // Create rounded rectangle blocks
      const blockWidth = Math.floor(Math.random() * width * 0.25) + 40
      const blockHeight = Math.floor(Math.random() * height * 0.15) + 30
      const blockX = Math.floor(Math.random() * (width - blockWidth))
      const blockY = Math.floor(Math.random() * (height - blockHeight))
      const cornerRadius = Math.min(blockWidth, blockHeight) * 0.3 // Larger corner radius

      // Save context
      ctx.save()

      // Create a clipping path with rounded rectangle
      ctx.beginPath()
      ctx.moveTo(blockX + cornerRadius, blockY)
      ctx.lineTo(blockX + blockWidth - cornerRadius, blockY)
      ctx.quadraticCurveTo(blockX + blockWidth, blockY, blockX + blockWidth, blockY + cornerRadius)
      ctx.lineTo(blockX + blockWidth, blockY + blockHeight - cornerRadius)
      ctx.quadraticCurveTo(blockX + blockWidth, blockY + blockHeight, blockX + blockWidth - cornerRadius, blockY + blockHeight)
      ctx.lineTo(blockX + cornerRadius, blockY + blockHeight)
      ctx.quadraticCurveTo(blockX, blockY + blockHeight, blockX, blockY + blockHeight - cornerRadius)
      ctx.lineTo(blockX, blockY + cornerRadius)
      ctx.quadraticCurveTo(blockX, blockY, blockX + cornerRadius, blockY)
      ctx.closePath()
      ctx.clip() // Clip to the rounded rectangle shape

      // Draw horizontal color bars (TV test pattern style)
      // Randomize the number of color bars and their order
      const numBars = 3 + Math.floor(Math.random() * 5); // 3-7 color bars
      const barHeight = blockHeight / numBars;
      
      // Shuffle the colors randomly for each block
      const shuffledColors = [...tvColors].sort(() => Math.random() - 0.5);
      
      // Draw the horizontal color bars
      for (let j = 0; j < numBars; j++) {
        const colorIndex = j % shuffledColors.length;
        ctx.fillStyle = shuffledColors[colorIndex];
        ctx.fillRect(blockX, blockY + (j * barHeight), blockWidth, barHeight);
      }

      // Add a blending mode to let the underlying image show through
      ctx.globalCompositeOperation = 'screen';
      
      // Add a slight shift effect to some bars
      if (Math.random() > 0.5) {
        const shiftY = blockY + Math.floor(Math.random() * blockHeight);
        const shiftHeight = Math.min(blockHeight - (shiftY - blockY), barHeight);
        const shiftAmount = Math.floor(Math.random() * 15) - 7;
        
        // Get image data for the area to shift
        const shiftData = ctx.getImageData(blockX, shiftY, blockWidth, shiftHeight);
        // Clear the original area
        ctx.clearRect(blockX, shiftY, blockWidth, shiftHeight);
        // Draw the shifted data
        ctx.putImageData(shiftData, blockX + shiftAmount, shiftY);
      }
      
      // Restore context
      ctx.restore();
    }
  }

  const chromaticAberration = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) => {
    const offset = Math.floor(intensity * 10)
    if (offset === 0) return

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
    if (!tempCtx) return

    // Copy original
    tempCtx.drawImage(ctx.canvas, 0, 0)

    // Apply RGB channel splitting
    ctx.globalCompositeOperation = 'screen'
    
    // Red channel
    ctx.fillStyle = 'rgba(255,0,0,0.5)'
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(tempCanvas, offset, 0)
    
    // Blue channel
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = 'rgba(0,0,255,0.5)'
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-in'
    ctx.drawImage(tempCanvas, -offset, 0)

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over'
    
    tempCanvas.remove()
  }

  const downloadGif = () => {
    if (!resultGif) return

    const link = document.createElement("a")
    link.href = resultGif
    link.download = "glitch-animation.gif"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Preview animation - update to use the new TV test pattern style
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

      // Clear canvas
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw first image as base - maintaining aspect ratio
      ctx.drawImage(img1, 0, 0, canvas.width, canvas.height)

      // Create glitch mask for second image
      ctx.save()
      ctx.globalAlpha = 0.85
      ctx.drawImage(img2, 0, 0, canvas.width, canvas.height)

      // Create random rounded rectangle holes
      ctx.globalCompositeOperation = 'destination-out'
      const holes = 3 + Math.floor(Math.random() * 3)
      for (let i = 0; i < holes; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const width = 50 + Math.random() * 150
        const height = 40 + Math.random() * 100
        const cornerRadius = Math.min(width, height) * 0.3

        // Draw rounded rectangle
        ctx.beginPath()
        ctx.moveTo(x + cornerRadius, y)
        ctx.lineTo(x + width - cornerRadius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius)
        ctx.lineTo(x + width, y + height - cornerRadius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height)
        ctx.lineTo(x + cornerRadius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius)
        ctx.lineTo(x, y + cornerRadius)
        ctx.quadraticCurveTo(x, y, x + cornerRadius, y)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()

      // Add TV test pattern colored blocks
      ctx.save()
      const intensity = glitchIntensity / 100
      const blockCount = Math.floor(intensity * 5)
      const tvColors = [
        'rgba(255,255,255,0.15)', // White
        'rgba(255,255,0,0.15)',   // Yellow
        'rgba(0,255,255,0.15)',   // Cyan
        'rgba(0,255,0,0.15)',     // Green
        'rgba(255,0,255,0.15)',   // Magenta
        'rgba(255,0,0,0.15)',     // Red
        'rgba(0,0,255,0.15)'      // Blue
      ]
      
      for (let i = 0; i < blockCount; i++) {
        const blockWidth = Math.floor(Math.random() * canvas.width * 0.25) + 40
        const blockHeight = Math.floor(Math.random() * canvas.height * 0.15) + 30
        const blockX = Math.floor(Math.random() * (canvas.width - blockWidth))
        const blockY = Math.floor(Math.random() * (canvas.height - blockHeight))
        const cornerRadius = Math.min(blockWidth, blockHeight) * 0.3
        
        // Create clipping path
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(blockX + cornerRadius, blockY)
        ctx.lineTo(blockX + blockWidth - cornerRadius, blockY)
        ctx.quadraticCurveTo(blockX + blockWidth, blockY, blockX + blockWidth, blockY + cornerRadius)
        ctx.lineTo(blockX + blockWidth, blockY + blockHeight - cornerRadius)
        ctx.quadraticCurveTo(blockX + blockWidth, blockY + blockHeight, blockX + blockWidth - cornerRadius, blockY + blockHeight)
        ctx.lineTo(blockX + cornerRadius, blockY + blockHeight)
        ctx.quadraticCurveTo(blockX, blockY + blockHeight, blockX, blockY + blockHeight - cornerRadius)
        ctx.lineTo(blockX, blockY + cornerRadius)
        ctx.quadraticCurveTo(blockX, blockY, blockX + cornerRadius, blockY)
        ctx.closePath()
        ctx.clip()
        
        // Draw horizontal color bars
        const numBars = 3 + Math.floor(Math.random() * 5)
        const barHeight = blockHeight / numBars
        const shuffledColors = [...tvColors].sort(() => Math.random() - 0.5)
        
        for (let j = 0; j < numBars; j++) {
          const colorIndex = j % shuffledColors.length
          ctx.fillStyle = shuffledColors[colorIndex]
          ctx.fillRect(blockX, blockY + (j * barHeight), blockWidth, barHeight)
        }
        
        // Add slight shift effect
        if (Math.random() > 0.7) {
          const shiftY = blockY + Math.floor(Math.random() * blockHeight * 0.7)
          const shiftHeight = Math.min(blockHeight * 0.3, barHeight)
          const shiftAmount = Math.floor(Math.random() * 8) - 4
          
          const shiftData = ctx.getImageData(blockX, shiftY, blockWidth, shiftHeight)
          ctx.clearRect(blockX, shiftY, blockWidth, shiftHeight)
          ctx.putImageData(shiftData, blockX + shiftAmount, shiftY)
        }
        
        ctx.restore()
      }
      
      // More subtle RGB shift
      const shift = Math.floor(intensity * 5)
      if (shift > 0) {
        ctx.globalCompositeOperation = 'screen'
        ctx.globalAlpha = 0.2
        ctx.drawImage(canvas, shift, 0)
        ctx.drawImage(canvas, -shift, 0)
      }
      
      // Subtle scan lines
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = 0.1
      for (let y = 0; y < canvas.height; y += 4) {
        if (Math.random() < intensity * 0.2) {
          ctx.fillStyle = "rgba(0,0,0,0.1)"
          ctx.fillRect(0, y, canvas.width, 2)
        }
      }
      ctx.restore()
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
              <img
                ref={image1Ref}
                src={image1 || "/placeholder.svg"}
                alt="First image"
                className="max-w-full max-h-full object-contain"
              />
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
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0 relative aspect-square flex items-center justify-center bg-black/10 dark:bg-white/5">
            {image2 ? (
              <img
                ref={image2Ref}
                src={image2 || "/placeholder.svg"}
                alt="Second image"
                className="max-w-full max-h-full object-contain"
              />
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
          onClick={generateGlitchAnimation}
          disabled={!image1 || !image2 || isGenerating}
          className="w-full md:w-auto"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Tv className="mr-2 h-4 w-4" />
              Generate Glitch Animation
            </>
          )}
        </Button>
      </div>

      {image1 && image2 && (
        <div className="mb-8">
          <div className="relative aspect-square w-full max-w-2xl mx-auto overflow-hidden rounded-lg bg-black/10">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-full object-contain"
            />
            <Button
              className="absolute bottom-4 right-4"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? "Stop Preview" : "Start Preview"}
            </Button>
          </div>
        </div>
      )}

      {resultGif && (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col items-center">
              <div className="mb-4 max-w-full overflow-hidden">
                <img
                  src={resultGif || "/placeholder.svg"}
                  alt="Glitch animation result"
                  className="max-w-full max-h-[500px] object-contain mx-auto"
                />
              </div>
              <Button onClick={downloadGif} className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download GIF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
