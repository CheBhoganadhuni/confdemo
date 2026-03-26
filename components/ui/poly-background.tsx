'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

type PolyBackgroundVariant = 'dark' | 'corner-right' | 'corner-left' | 'full'

interface PolyBackgroundProps {
  variant?: PolyBackgroundVariant
  className?: string
  /** Enable scroll-reactive movement */
  reactive?: boolean
}

export function PolyBackground({ variant = 'dark', className, reactive = true }: PolyBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  
  // Smooth spring for scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Transform values for each polygon group
  const rotate1 = useTransform(smoothProgress, [0, 1], [0, 25])
  const rotate2 = useTransform(smoothProgress, [0, 1], [0, -20])
  const rotate3 = useTransform(smoothProgress, [0, 1], [0, 15])
  const rotate4 = useTransform(smoothProgress, [0, 1], [0, -30])
  
  const translateX1 = useTransform(smoothProgress, [0, 1], [0, 40])
  const translateY1 = useTransform(smoothProgress, [0, 1], [0, -60])
  
  const translateX2 = useTransform(smoothProgress, [0, 1], [0, -30])
  const translateY2 = useTransform(smoothProgress, [0, 1], [0, 50])
  
  const translateX3 = useTransform(smoothProgress, [0, 1], [0, 25])
  const translateY3 = useTransform(smoothProgress, [0, 1], [0, -35])
  
  const translateX4 = useTransform(smoothProgress, [0, 1], [0, -50])
  const translateY4 = useTransform(smoothProgress, [0, 1], [0, 40])

  const scale = useTransform(smoothProgress, [0, 1], [1, 1.08])

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

  if (!reactive) {
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
          <polygon points="650,50 800,150 780,300 650,380 500,300 480,150" />
          <polygon points="50,200 200,100 350,180 370,350 220,430 70,360" />
          <polygon points="300,400 450,350 560,440 520,580 340,600" />
          <polygon points="400,80 520,120 540,220 450,280 340,240 320,140" />
          <line x1="650" y1="50" x2="350" y2="180" />
          <line x1="200" y1="100" x2="480" y2="150" />
          <line x1="370" y1="350" x2="500" y2="300" />
          <line x1="520" y1="120" x2="650" y2="50" />
          <line x1="340" y1="240" x2="220" y2="430" />
        </g>
      </svg>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute pointer-events-none overflow-hidden',
        getPosition(),
        getSize(),
        className
      )}
    >
      <motion.svg
        className="w-full h-full"
        viewBox="0 0 800 600"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{ scale }}
      >
        <g fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.06">
          {/* Large polyhedron - right side */}
          <motion.g
            style={{
              x: translateX1,
              y: translateY1,
              rotate: rotate1,
              transformOrigin: '650px 215px'
            }}
          >
            <polygon points="650,50 800,150 780,300 650,380 500,300 480,150" />
          </motion.g>
          
          {/* Medium polyhedron - left side */}
          <motion.g
            style={{
              x: translateX2,
              y: translateY2,
              rotate: rotate2,
              transformOrigin: '210px 265px'
            }}
          >
            <polygon points="50,200 200,100 350,180 370,350 220,430 70,360" />
          </motion.g>
          
          {/* Small polyhedron - bottom center */}
          <motion.g
            style={{
              x: translateX3,
              y: translateY3,
              rotate: rotate3,
              transformOrigin: '430px 475px'
            }}
          >
            <polygon points="300,400 450,350 560,440 520,580 340,600" />
          </motion.g>
          
          {/* Additional geometric shape - top center */}
          <motion.g
            style={{
              x: translateX4,
              y: translateY4,
              rotate: rotate4,
              transformOrigin: '430px 180px'
            }}
          >
            <polygon points="400,80 520,120 540,220 450,280 340,240 320,140" />
          </motion.g>
          
          {/* Connecting lines - these move subtly with overall scale */}
          <line x1="650" y1="50" x2="350" y2="180" />
          <line x1="200" y1="100" x2="480" y2="150" />
          <line x1="370" y1="350" x2="500" y2="300" />
          <line x1="520" y1="120" x2="650" y2="50" />
          <line x1="340" y1="240" x2="220" y2="430" />
        </g>
      </motion.svg>
    </div>
  )
}
