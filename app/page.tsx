import { GlitchAnimator } from "@/components/glitch-animator"
import { GlitchText } from "@/components/glitch-text"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between">
        <div className="mb-12 text-center">
          <GlitchText 
            text="Glitch Animation Generator" 
            className="text-5xl font-extrabold"
            speed={6}
            shimmerWidth={180}
          />
        </div>

        <GlitchAnimator />
        
        <footer className="mt-16 text-center text-sm">
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
      </div>
    </main>
  )
}
