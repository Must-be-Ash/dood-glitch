"use client"

import { GlitchText } from "@/components/glitch-text"

export function Footer() {
  return (
    <footer className="w-full mt-auto pb-32 sm:pb-24 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        <GlitchText 
          text="made by" 
          className="text-sm font-normal"
          speed={8}
          shimmerWidth={60}
        />
        <a href="https://x.com/Must_be_Ash" className="inline-block">
          <GlitchText 
            text="@must_be_ash" 
            className="text-sm hover:text-[#ff42d0] transition-colors"
            speed={8}
            shimmerWidth={80}
          />
        </a>
      </div>
    </footer>
  )
} 