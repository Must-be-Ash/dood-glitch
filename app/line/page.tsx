'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { GlitchText } from "@/components/glitch-text";
import { Footer } from "@/components/footer"
import { Download } from "lucide-react"

export default function OutlinePage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    // Reset images on new upload for clarity
    setOriginalImage(null); 
    setProcessedImage(null);
    
    // Display original image
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process image
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch or parse error from /api/process-image' }));
        throw new Error(errorData.error || 'Failed to process image using /api/process-image');
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
        a.download = 'outline-dood.png'
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
              text="Line Doods" 
              className="text-4xl font-extrabold"
              speed={6}
              shimmerWidth={150}
            />
          </div>
          <p className="text-center mb-12">
            Upload your doolde to get its line drawing
          </p>
          
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
            
            {loading && (
              <div className="flex items-center justify-center mt-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-purple-400">Processing...</span>
              </div>
            )}
            
            {error && (
              <div className="mt-6 p-4 bg-red-900/50 text-red-300 rounded-lg border border-red-800">{error}</div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-10 md:gap-16 mb-32">
            {originalImage && (
              <div className="bg-gray-900/50 backdrop-blur-sm p-4 pt-4 pb-12 rounded-md shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out w-64 md:w-72 border border-gray-800">
                <h2 className="text-lg font-semibold mb-3 text-center">Original Dood</h2>
                <div className="relative w-full aspect-square bg-gray-800 rounded-sm overflow-hidden">
                  <Image
                    src={originalImage}
                    alt="Original"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {processedImage && (
              <div className="bg-gray-900/50 backdrop-blur-sm p-4 pt-4 pb-12 rounded-md shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-300 ease-in-out w-64 md:w-72 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-center">Outline Dood</h2>
                  <button
                    onClick={handleDownload}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    title="Download processed image"
                  >
                    <Download size={20} />
                  </button>
                </div>
                <div className="relative w-full aspect-square bg-gray-800 rounded-sm overflow-hidden">
                  <Image
                    src={processedImage}
                    alt="Outline Dood"
                    fill
                    className="object-contain"
                    unoptimized
                  />
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