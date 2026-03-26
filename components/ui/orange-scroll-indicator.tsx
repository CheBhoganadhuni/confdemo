'use client'

import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface OrangeScrollIndicatorProps {
  targetId?: string
  className?: string
}

export function OrangeScrollIndicator({ targetId, className }: OrangeScrollIndicatorProps) {
  const { scrollYProgress } = useScroll()
  // Rotate the text ring based on scroll — full 360 per page scroll
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 720])

  const handleClick = () => {
    if (targetId) {
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'relative w-[80px] h-[80px] md:w-[100px] md:h-[100px] flex items-center justify-center',
        className
      )}
      aria-label="Scroll down"
    >
      {/* Scroll-synced rotating text ring */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        style={{ rotate }}
      >
        <defs>
          <path
            id="circlePath"
            d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
            fill="none"
          />
        </defs>
        <text
          className="fill-[var(--text-secondary)] text-[9px] uppercase tracking-[0.25em]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <textPath href="#circlePath" startOffset="0%">
            SCROLL DOWN • SCROLL DOWN • SCROLL DOWN •
          </textPath>
        </text>
      </motion.svg>

      {/* Center orange button */}
      <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#F97316] hover:bg-[#EA6B0A] transition-colors flex items-center justify-center cursor-pointer">
        <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-black" strokeWidth={2.5} />
      </div>
    </button>
  )
}
