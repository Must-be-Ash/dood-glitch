import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/react"
import DockNavigation from "@/components/nav"
import type { Metadata, Viewport } from 'next'

const inter = Inter({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: "#000000",
}

export const metadata: Metadata = {
  title: "Porty",
  description: "Enter the portal my doods",
  keywords: "Animation, DOOD, Doodles, Darkmode Dood",
  authors: [{ name: "@must_be_ash" }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    other: [
      { 
        rel: 'mask-icon', 
        url: '/safari-pinned-tab.svg',
        color: '#5bbad5'
      },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Porty",
    description: "Enter the portal my doods",
    url: "https://www.porty.app/",
    type: "website",
    images: [
      {
        url: "https://www.porty.app/og.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Porty",
    description: "Enter the portal my doods",
    images: ["https://www.porty.app/og.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem={false} 
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
          <DockNavigation />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
