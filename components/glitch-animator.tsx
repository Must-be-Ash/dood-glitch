"use client"

import type React from "react"

import { useState, useRef } from "react"
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

  const canvasRef = useRef<HTMLCanvasElement>(null)
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
      img1.crossOrigin = "anonymous"
      img2.crossOrigin = "anonymous"
      img1.src = image1
      img2.src = image2

      await Promise.all([
        new Promise((resolve, reject) => {
          img1.onload = resolve
          img1.onerror = () => reject(new Error("Failed to load first image"))
        }),
        new Promise((resolve, reject) => {
          img2.onload = resolve
          img2.onerror = () => reject(new Error("Failed to load second image"))
        }),
      ])

      // Set canvas dimensions to match images
      canvas.width = Math.max(img1.width, img2.width)
      canvas.height = Math.max(img1.height, img2.height)

      // Create a GIF encoder
      const gif = new GIF({
        workers: 1,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: "/gif.worker.js",
        debug: true,
        dither: false, // Disable dithering for cleaner effect
        transparent: null, // No transparency
      })

      // Generate frames
      for (let i = 0; i < frameCount; i++) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw the first image as base layer
        ctx.drawImage(img1, 0, 0, canvas.width, canvas.height)

        // Create a temporary canvas for the second image
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
        if (!tempCtx) continue

        // Draw second image to temp canvas
        tempCtx.drawImage(img2, 0, 0, canvas.width, canvas.height)

        // Create glitch mask on temp canvas
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = canvas.width
        maskCanvas.height = canvas.height
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })
        if (!maskCtx) continue

        // Create dynamic reveal pattern
        maskCtx.fillStyle = 'black'
        maskCtx.fillRect(0, 0, canvas.width, canvas.height)
        maskCtx.fillStyle = 'white'
        
        const revealCount = 8 + Math.floor(Math.random() * 5)
        for (let h = 0; h < revealCount; h++) {
          const x = Math.random() * canvas.width
          const y = Math.random() * canvas.height
          const size = 30 + Math.random() * 100
          
          maskCtx.beginPath()
          maskCtx.moveTo(x, y)
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const radius = size * (0.5 + Math.random() * 0.5)
            const px = x + Math.cos(a) * radius
            const py = y + Math.sin(a) * radius
            maskCtx.lineTo(px, py)
          }
          maskCtx.closePath()
          maskCtx.fill()
        }

        // Apply mask to second image
        tempCtx.globalCompositeOperation = 'destination-in'
        tempCtx.drawImage(maskCanvas, 0, 0)

        // Draw masked second image onto main canvas
        ctx.globalAlpha = 0.8
        ctx.drawImage(tempCanvas, 0, 0)
        ctx.globalAlpha = 1.0

        // Apply glitch effects
        applyGlitchEffects(ctx, canvas.width, canvas.height, glitchIntensity / 100)

        // Add frame to GIF
        gif.addFrame(canvas, { 
          copy: true, 
          delay: glitchSpeed,
          dispose: 2 // Clear frame before drawing next one
        })
      }

      // Render the GIF
      gif.on("finished", (blob: Blob) => {
        try {
          // Create a temporary link and trigger download
          const url = URL.createObjectURL(blob)
          const tempLink = document.createElement('a')
          tempLink.href = url
          tempLink.download = 'glitch-animation.gif'
          document.body.appendChild(tempLink)
          tempLink.click()
          document.body.removeChild(tempLink)
          
          // Clean up the blob URL after a short delay
          setTimeout(() => {
            URL.revokeObjectURL(url)
          }, 100)

          setResultGif(url)
          setIsGenerating(false)
        } catch (error) {
          console.error('Error saving GIF:', error)
          setIsGenerating(false)
        }
      })

      console.log("Starting GIF render...")
      gif.render()
    } catch (error) {
      console.error("Error generating glitch animation:", error)
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

    // RGB shift
    rgbShift(data, width, height, intensity)

    // Scan lines
    scanLines(data, width, height, intensity)

    // Noise
    addNoise(data, width, height, intensity)

    // Put the modified image data back to temp canvas
    tempCtx.putImageData(imageData, 0, 0)

    // Apply the glitch overlay with transparency
    ctx.save()
    ctx.globalAlpha = 0.7 // Make glitch effect partially transparent
    ctx.drawImage(tempCanvas, 0, 0)
    ctx.restore()

    // Random blocks with reveal effect
    if (Math.random() < intensity * 0.8) {
      randomBlocks(ctx, width, height, intensity)
    }
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
    const lineFrequency = Math.max(2, Math.floor(20 - intensity * 15))
    const lineOpacity = intensity * 0.5

    for (let y = 0; y < height; y++) {
      if (y % lineFrequency === 0) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4

          // Darken the scan line
          data[i] = Math.floor(data[i] * (1 - lineOpacity))
          data[i + 1] = Math.floor(data[i + 1] * (1 - lineOpacity))
          data[i + 2] = Math.floor(data[i + 2] * (1 - lineOpacity))
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
    const blockCount = Math.floor(intensity * 15) // Increased block count
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
    if (!tempCtx) return

    // Copy current state
    tempCtx.drawImage(ctx.canvas, 0, 0)

    for (let i = 0; i < blockCount; i++) {
      const blockWidth = Math.floor(Math.random() * width * 0.2) + 20
      const blockHeight = Math.floor(Math.random() * height * 0.1) + 10
      const blockX = Math.floor(Math.random() * (width - blockWidth))
      const blockY = Math.floor(Math.random() * (height - blockHeight))

      // Get block data
      const blockData = tempCtx.getImageData(blockX, blockY, blockWidth, blockHeight)

      // Apply some color distortion to the block
      for (let j = 0; j < blockData.data.length; j += 4) {
        const offset = Math.floor(Math.random() * 50 - 25)
        blockData.data[j] = Math.min(255, Math.max(0, blockData.data[j] + offset))
        blockData.data[j + 1] = Math.min(255, Math.max(0, blockData.data[j + 1] + offset))
        blockData.data[j + 2] = Math.min(255, Math.max(0, blockData.data[j + 2] + offset))
      }

      // Shift the block horizontally
      const shiftX = Math.floor((Math.random() - 0.5) * width * 0.2)
      const targetX = Math.min(width - blockWidth, Math.max(0, blockX + shiftX))

      // Draw the distorted block
      ctx.putImageData(blockData, targetX, blockY)
    }
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
