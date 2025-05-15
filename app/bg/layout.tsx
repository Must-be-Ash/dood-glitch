import { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#000000',
}

export const metadata: Metadata = {
  title: 'Background Changer - Porty',
  description: 'Remove background from your doodle and place it on a new one!',
}

export default function BackgroundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 