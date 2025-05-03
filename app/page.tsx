import { GlitchAnimator } from "@/components/glitch-animator"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="mb-8 text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500">
          Glitch Animation Generator
        </h1>

        <p className="text-center mb-8 text-gray-400">
          Upload two images and create a glitchy animation that alternates between them
        </p>

        <GlitchAnimator />
      </div>
    </main>
  )
}
