'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { GlitchText } from "@/components/glitch-text";
import { Footer } from "@/components/footer"
import { Download } from "lucide-react"

export default function StickerPage() {
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setProcessedImage(null);
    
    // Process image
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/add-sticker', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to process image' }));
        throw new Error(errorData.error || 'Failed to add sticker to image');
      }

      const blob = await response.blob();
      const processedImageUrl = URL.createObjectURL(blob);
      setProcessedImage(processedImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (processedImage) {
      try {
        const response = await fetch(processedImage)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sticker-dood.png'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (err) {
        console.error('Error downloading image:', err)
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-16 sm:pt-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between flex-1">
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <GlitchText 
              text="Sticker Doods" 
              className="text-4xl font-extrabold"
              speed={6}
              shimmerWidth={150}
            />
          </div>
          <p className="text-center mb-12">
            Get a Dood sticker on your Doodle
          </p>
          
          <div className="mb-12 p-6 bg-[#222222] backdrop-blur-sm rounded-xl shadow-lg border border-[#333333]">
            {!processedImage && (
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
            )}
            
            {loading && (
              <div className="flex items-center justify-center mt-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-purple-400">Processing...</span>
              </div>
            )}
            
            {error && (
              <div className="mt-6 p-4 bg-red-900/50 text-red-300 rounded-lg border border-red-800">{error}</div>
            )}

            {processedImage && (
              <div className="space-y-4">
                <div className="relative w-full aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={processedImage}
                    alt="Sticker Dood"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setProcessedImage(null);
                      setError(null);
                    }}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Upload another
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <Download size={20} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
} 