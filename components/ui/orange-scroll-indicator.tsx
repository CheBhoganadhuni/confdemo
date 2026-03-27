'use client'

import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useState, useEffect } from 'react'

interface OrangeScrollIndicatorProps {
  sectionIds: string[]
  className?: string
}

export function OrangeScrollIndicator({ sectionIds, className }: OrangeScrollIndicatorProps) {
  const { scrollYProgress } = useScroll()
  const rawRotate = useTransform(scrollYProgress, [0, 1], [0, 720])
  const rotate = useSpring(rawRotate, { stiffness: 80, damping: 30, mass: 0.5 })

  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    const check = () => {
      const nearBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 120
      setAtBottom(nearBottom)
    }
    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [])

  const handleClick = () => {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Find next section whose top is meaningfully below the viewport top
    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) {
        const rect = el.getBoundingClientRect()
        if (rect.top > 80) {
          el.scrollIntoView({ behavior: 'smooth' })
          return
        }
      }
    }

    // All sections already passed — scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const label = atBottom ? 'BACK TO TOP' : 'SCROLL DOWN'
  const ringText = atBottom
    ? 'BACK TO TOP • BACK TO TOP • BACK TO TOP •'
    : 'SCROLL DOWN • SCROLL DOWN • SCROLL DOWN •'

  return (
    <div className="group">
      <button
        onClick={handleClick}
        className={cn(
          'relative w-[80px] h-[80px] md:w-[100px] md:h-[100px] flex items-center justify-center',
          className
        )}
        aria-label={label}
      >
        {/* Scroll-synced rotating text ring */}
        <motion.svg
          className="absolute inset-0 w-full h-full will-change-transform"
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
            fill="#555"
            fontSize="9"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.25em', textTransform: 'uppercase' }}
          >
            <textPath href="#circlePath" startOffset="0%">
              {ringText}
            </textPath>
          </text>
        </motion.svg>

        {/* Center orange button — scales on hover, no glow */}
        <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-[#F97316] hover:bg-[#EA6B0A] flex items-center justify-center cursor-pointer transition-all duration-300 group-hover:scale-110">
          {atBottom
            ? <ChevronUp  className="w-4 h-4 md:w-5 md:h-5 text-black" strokeWidth={2.5} />
            : <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-black" strokeWidth={2.5} />
          }
        </div>
      </button>
    </div>
  )
}
