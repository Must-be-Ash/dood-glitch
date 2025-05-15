# Implementing the Glitch Animator Effect

This guide will walk you through implementing a glitch animation effect similar to our site's title animations. The effect combines shimmering text, glitch effects, and smooth transitions to create an engaging visual experience.

## Prerequisites

- Next.js project (13.4 or higher)
- Tailwind CSS
- TypeScript
- `lucide-react` for icons (optional)
- `@radix-ui/react-slider` (if using the control sliders)
- `sharp` for image processing

## Setup Steps

### 1. Configure Tailwind CSS

First, update your `tailwind.config.ts` to include the necessary animations and utilities:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'shine': 'shine 6s linear infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### 2. Add Required CSS

Add these styles to your `globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .animate-shine {
    animation: shine 6s linear infinite;
  }
  .animate-gradient {
    background-size: 200% auto;
    animation: gradient 3s ease infinite;
  }
}

@keyframes shine {
  from {
    background-position: 200% center;
  }
  to {
    background-position: -200% center;
  }
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

## Implementation

### Basic Glitch Text Component

Create a new component called `GlitchText.tsx`:

```typescript
"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface GlitchTextProps {
  text: string
  className?: string
  speed?: number
  shimmerWidth?: number
}

export function GlitchText({ 
  text, 
  className, 
  speed = 6,
  shimmerWidth = 150 
}: GlitchTextProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <span 
      className={cn(
        "bg-gradient-to-r from-transparent via-foreground to-transparent",
        "bg-[length:200%_100%]",
        "animate-shine",
        className
      )}
      style={{
        animationDuration: `${speed}s`,
        backgroundSize: `${shimmerWidth}% 100%`
      }}
    >
      {text}
    </span>
  )
}
```

### Usage Examples

1. Basic Usage:
```tsx
import { GlitchText } from "@/components/glitch-text"

export default function Page() {
  return (
    <h1>
      <GlitchText 
        text="Shimmering Title" 
        className="text-4xl font-bold"
      />
    </h1>
  )
}
```

2. Customized Animation:
```tsx
<GlitchText 
  text="Fast Shimmer" 
  className="text-2xl font-extrabold"
  speed={3} // Faster animation
  shimmerWidth={100} // Narrower shimmer effect
/>
```

## Advanced Features

### Customization Options

1. **Speed**: Control animation speed using the `speed` prop (in seconds)
   - Lower values = faster animation
   - Higher values = slower animation
   - Default: 6 seconds

2. **Shimmer Width**: Adjust the width of the shimmer effect using `shimmerWidth`
   - Lower values = narrower shimmer
   - Higher values = wider shimmer
   - Default: 150

3. **Styling**: Use the `className` prop to add custom styles
   - Supports all Tailwind classes
   - Can include custom CSS classes

### Best Practices

1. **Performance**:
   - Component is client-side rendered (`"use client"`)
   - Uses mounting check to prevent hydration issues
   - Efficient animation using CSS transforms

2. **Accessibility**:
   - Text remains selectable
   - No impact on screen readers
   - Maintains contrast ratios

3. **Responsive Design**:
   - Works across all screen sizes
   - Animation scales with text size
   - Customizable for different viewports

## Troubleshooting

Common issues and solutions:

1. **Animation Not Working**:
   - Ensure Tailwind animations are properly configured
   - Check if `tailwindcss-animate` plugin is installed
   - Verify CSS keyframes are properly defined

2. **Performance Issues**:
   - Reduce number of animated elements
   - Increase animation duration
   - Use `will-change` CSS property for better performance

3. **Hydration Errors**:
   - Always use `"use client"` directive
   - Implement mounting check as shown in example
   - Avoid server/client text content mismatch

## Additional Tips

1. **Combining Effects**:
   - Can be combined with other animations
   - Works well with hover states
   - Supports transition effects

2. **Dark Mode Support**:
   - Automatically works with dark mode
   - Uses currentColor for gradient
   - Maintains visibility in both themes

3. **Mobile Optimization**:
   - Reduces animation on low-power mode
   - Supports touch interactions
   - Maintains performance on mobile devices

## Example Implementation

Here's a complete example showing various ways to use the component:

```tsx
import { GlitchText } from "@/components/glitch-text"

export default function DemoPage() {
  return (
    <div className="space-y-8">
      {/* Basic Title */}
      <h1>
        <GlitchText 
          text="Welcome to My Site" 
          className="text-4xl font-extrabold"
        />
      </h1>

      {/* Fast Subtitle */}
      <h2>
        <GlitchText 
          text="Quick Shimmer Effect" 
          className="text-2xl font-bold"
          speed={3}
        />
      </h2>

      {/* Wide Shimmer Text */}
      <p>
        <GlitchText 
          text="Wide Glowing Text" 
          className="text-xl"
          shimmerWidth={200}
        />
      </p>

      {/* Combined with Other Effects */}
      <div className="hover:scale-105 transition-transform">
        <GlitchText 
          text="Hover to Scale" 
          className="text-lg font-medium"
        />
      </div>
    </div>
  )
}
```

Remember to adjust the animation parameters to match your site's design and performance requirements. The effect works best when used sparingly on important text elements like headings or call-to-action elements.
