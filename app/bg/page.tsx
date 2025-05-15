"use client"

import { GlitchText } from "@/components/glitch-text"
import { BackgroundChanger } from "@/components/background-changer"
import { Footer } from "@/components/footer"

export default function BackgroundChangerPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-16 sm:pt-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between flex-1">
        <div className="text-center mb-8">
          <GlitchText 
            text="Background Changer" 
            className="text-4xl font-extrabold"
            speed={6}
            shimmerWidth={150}
          />
        </div>
        <p className="text-center mb-12">
          Remove background from your doodle and place it on a new one!
        </p>
        
        <BackgroundChanger />
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </main>
  )
}
