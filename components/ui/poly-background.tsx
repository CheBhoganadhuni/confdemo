'use client'

import { cn } from '@/lib/utils'

type PolyBackgroundVariant = 'dark' | 'corner-right' | 'corner-left' | 'full'

interface PolyBackgroundProps {
  variant?: PolyBackgroundVariant
  className?: string
}

export function PolyBackground({ variant = 'dark', className }: PolyBackgroundProps) {
  const getPosition = () => {
    switch (variant) {
      case 'corner-right':
        return 'right-0 top-0'
      case 'corner-left':
        return 'left-0 top-0'
      case 'full':
        return 'inset-0'
      default:
        return 'right-0 top-1/2 -translate-y-1/2'
    }
  }

  const getSize = () => {
    switch (variant) {
      case 'corner-right':
      case 'corner-left':
        return 'w-[800px] h-[600px]'
      case 'full':
        return 'w-full h-full'
      default:
        return 'w-[900px] h-[700px]'
    }
  }

  return (
    <svg
      className={cn(
        'absolute pointer-events-none',
        getPosition(),
        getSize(),
        className
      )}
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.06">
        {/* Large polyhedron - right side */}
        <polygon points="650,50 800,150 780,300 650,380 500,300 480,150" />
        
        {/* Medium polyhedron - left side */}
        <polygon points="50,200 200,100 350,180 370,350 220,430 70,360" />
        
        {/* Small polyhedron - bottom center */}
        <polygon points="300,400 450,350 560,440 520,580 340,600" />
        
        {/* Additional geometric shape */}
        <polygon points="400,80 520,120 540,220 450,280 340,240 320,140" />
        
        {/* Connecting lines */}
        <line x1="650" y1="50" x2="350" y2="180" />
        <line x1="200" y1="100" x2="480" y2="150" />
        <line x1="370" y1="350" x2="500" y2="300" />
        <line x1="520" y1="120" x2="650" y2="50" />
        <line x1="340" y1="240" x2="220" y2="430" />
      </g>
    </svg>
  )
}
