'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

type PolyBackgroundVariant = 'dark' | 'corner-right' | 'corner-left' | 'full'

interface PolyBackgroundProps {
  variant?: PolyBackgroundVariant
  className?: string
  /** Enable scroll-reactive rotation of shapes */
  scrollReactive?: boolean
}

export function PolyBackground({ variant = 'dark', className, scrollReactive = false }: PolyBackgroundProps) {
  const ref = useRef<SVGSVGElement>(null)

  const { scrollYProgress } = useScroll({
    offset: ['start start', 'end start'],
  })

  // Smooth continuous rotation with different speeds per shape
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 90])
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -60])
  const rotate3 = useTransform(scrollYProgress, [0, 1], [0, 120])
  const rotate4 = useTransform(scrollYProgress, [0, 1], [0, -45])
  // Subtle parallax drift
  const translateY1 = useTransform(scrollYProgress, [0, 1], [0, -40])
  const translateY2 = useTransform(scrollYProgress, [0, 1], [0, 30])
  const translateY3 = useTransform(scrollYProgress, [0, 1], [0, -20])
  const scale1 = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.05, 0.95])

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
        return 'w-[600px] h-[500px] sm:w-[800px] sm:h-[600px]'
      case 'full':
        return 'w-full h-full'
      default:
        return 'w-[700px] h-[500px] sm:w-[900px] sm:h-[700px]'
    }
  }

  if (!scrollReactive) {
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
    <svg
      ref={ref}
      className={cn(
        'absolute pointer-events-none will-change-transform',
        getPosition(),
        getSize(),
        className
      )}
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.06">
        {/* Large polyhedron - right side, rotates + drifts on scroll */}
        <motion.g
          style={{
            rotate: rotate1,
            translateY: translateY1,
            scale: scale1,
            transformOrigin: '650px 215px',
          }}
        >
          <polygon points="650,50 800,150 780,300 650,380 500,300 480,150" />
        </motion.g>

        {/* Medium polyhedron - left side */}
        <motion.g
          style={{
            rotate: rotate2,
            translateY: translateY2,
            transformOrigin: '210px 265px',
          }}
        >
          <polygon points="50,200 200,100 350,180 370,350 220,430 70,360" />
        </motion.g>

        {/* Small polyhedron - bottom center */}
        <motion.g
          style={{
            rotate: rotate3,
            translateY: translateY3,
            transformOrigin: '430px 475px',
          }}
        >
          <polygon points="300,400 450,350 560,440 520,580 340,600" />
        </motion.g>

        {/* Additional geometric shape */}
        <motion.g
          style={{
            rotate: rotate4,
            translateY: translateY1,
            transformOrigin: '430px 180px',
          }}
        >
          <polygon points="400,80 520,120 540,220 450,280 340,240 320,140" />
        </motion.g>

        {/* Connecting lines - subtle drift */}
        <motion.g style={{ rotate: rotate1, translateY: translateY2, transformOrigin: '500px 115px' }}>
          <line x1="650" y1="50" x2="350" y2="180" />
          <line x1="520" y1="120" x2="650" y2="50" />
        </motion.g>
        <motion.g style={{ rotate: rotate2, translateY: translateY3, transformOrigin: '340px 265px' }}>
          <line x1="200" y1="100" x2="480" y2="150" />
          <line x1="340" y1="240" x2="220" y2="430" />
        </motion.g>
        <motion.g style={{ rotate: rotate3, translateY: translateY1, transformOrigin: '435px 325px' }}>
          <line x1="370" y1="350" x2="500" y2="300" />
        </motion.g>
      </g>
    </svg>
  )
}
