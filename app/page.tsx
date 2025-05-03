import { GlitchAnimator } from "@/components/glitch-animator"
import { GlitchText } from "@/components/glitch-text"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-black">
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
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Create distorted animations by combining two images with glitch effects</p>
        </footer>
      </div>
    </main>
  )
}
