"use client"

import React from 'react'
import { GlitchText } from "@/components/glitch-text"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-16 sm:pt-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between flex-1">
        <motion.div 
          className="mb-16 sm:mb-12 text-center pt-8 sm:pt-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <GlitchText 
            text="Porty" 
            className="text-6xl font-extrabold"
            speed={6}
            shimmerWidth={180}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative mt-2"
          >
            <p className="text-center mb-12">
              enter the portal my doods <br /> see you on the other side!
            </p>
          </motion.div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <OptionCard 
            title="GlitchUp"
            href="/glitch"
            imageSrc="/glitch-animation.gif"
            delay={0.2}
          />
          <OptionCard 
            title="LineUp"
            href="/line"
            imageSrc="/line.png"
            delay={0.4}
          />
          <OptionCard 
            title="LightUp"
            href="/light-up"
            imageSrc="/light-up.mp4"
            delay={0.6}
            isVideo
          />
          <OptionCard 
            title="Sticker"
            href="/sticker"
            imageSrc="/sticker-dood.png"
            delay={0.8}
          />
          <OptionCard 
            title="Background"
            href="/bg"
            imageSrc="/bg/moon.png"
            delay={1.0}
          />
          <OptionCard 
            title="DoodCatch"
            href="https://catch.porty.app/"
            imageSrc="/dood-token.MP4"
            delay={1.2}
            isVideo
            isExternal
          />
          {/* <OptionCard 
            title="chartJump"
            href="https://jump.porty.app/"
            imageSrc="/jump.mp4"
            delay={1.3}
            isVideo
            isExternal
          /> */}
          <OptionCard 
            title="doodJump"
            href="https://doodjump.porty.app/"
            imageSrc="/doodjump.png"
            delay={1.3}
            isExternal
          />
          <OptionCard 
            title={<div className="flex flex-col">
              <span>Memorizer</span>
              <span className="text-xs text-gray-400">by @tzx0318</span>
            </div>}
            href="https://doodle-memorizer.vercel.app/"
            imageSrc="/memorizer.png"
            delay={1.4}
            isExternal
          />
        </motion.div>
      </div>
      <div className="mt-24 sm:mt-12">
        <Footer />
      </div>
    </main>
  )
}

function OptionCard({ 
  title, 
  href, 
  imageSrc, 
  delay,
  isVideo = false,
  isExternal = false 
}: { 
  title: string | React.ReactNode; 
  href: string; 
  imageSrc: string;
  delay: number;
  isVideo?: boolean;
  isExternal?: boolean;
}) {
  const LinkComponent = isExternal ? 'a' : Link;
  const linkProps = isExternal ? { 
    href,
    target: "_blank",
    rel: "noopener noreferrer"
  } : { href };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
    >
      <LinkComponent 
        {...linkProps}
        className="block h-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900/50 backdrop-blur-sm transition-all"
      >
        <div className="aspect-video w-full relative overflow-hidden">
          {isVideo ? (
            <video
              src={imageSrc}
              autoPlay
              loop
              muted
              playsInline
              className="object-cover w-full h-full"
            />
          ) : (
          <Image 
            src={imageSrc} 
            alt={title as string} 
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          )}
        </div>
        <div className="p-4">
          <h3 className="text-xl font-semibold text-center">{title}</h3>
        </div>
      </LinkComponent>
    </motion.div>
  )
}
