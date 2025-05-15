"use client"

import { Home, PenLine, Zap, Lightbulb, Sticker, Image } from 'lucide-react'
import { NavBar } from "@/components/ui/tubelight-navbar"
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function DockNavigation() {
  const pathname = usePathname()
  const [activeItem, setActiveItem] = useState('Porty')
  
  // Navigation items for our Dood tools
  const navItems = [
    { name: 'Porty', url: '/', icon: Home },
    { name: 'GlitchUp', url: '/glitch', icon: Zap },
    { name: 'LineUp', url: '/line', icon: PenLine },
    { name: 'LightUp', url: '/light-up', icon: Lightbulb },
    { name: 'Sticker', url: '/sticker', icon: Sticker },
    { name: 'BG', url: '/bg', icon: Image }
  ]
  
  // Update active item based on current path
  useEffect(() => {
    if (pathname === '/') {
      setActiveItem('Porty')
    } else if (pathname === '/glitch') {
      setActiveItem('GlitchUp')
    } else if (pathname === '/line') {
      setActiveItem('LineUp')
    } else if (pathname === '/light-up') {
      setActiveItem('LightUp')
    } else if (pathname === '/sticker') {
      setActiveItem('Sticker')
    } else if (pathname === '/bg') {
      setActiveItem('BG')
    }
  }, [pathname])
  
  // Function to match current path to navigation item
  const getNavItemsWithActive = () => {
    return navItems.map(item => ({
      ...item,
      isActive: item.name === activeItem
    }))
  }

  return (
    <NavBar 
      items={navItems} 
      className="max-w-2xl"
      activeTab={activeItem}
    />
  )
}

export default DockNavigation
