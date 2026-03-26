'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface OrangeScrollIndicatorProps {
  targetId?: string
  className?: string
}

export function OrangeScrollIndicator({ targetId, className }: OrangeScrollIndicatorProps) {
  const [rotation, setRotation] = useState(0)
  const rafRef = useRef<number>()
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return
      
      rafRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY
        const delta = scrollY - lastScrollY.current
        
        // Rotate based on scroll direction and amount
        // Positive delta = scrolling down = rotate clockwise
        // The rotation accumulates with scroll
        setRotation(prev => prev + delta * 0.3)
        
        lastScrollY.current = scrollY
        rafRef.current = undefined
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

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
        'relative w-[100px] h-[100px] flex items-center justify-center',
        className
      )}
      aria-label="Scroll down"
    >
      {/* Rotating text ring - rotates on scroll */}
      <svg
        className="absolute inset-0 w-full h-full transition-transform duration-150 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
        viewBox="0 0 100 100"
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
      </svg>

      {/* Center orange button */}
      <div className="w-11 h-11 rounded-full bg-[#F97316] hover:bg-[#EA6B0A] transition-colors flex items-center justify-center cursor-pointer">
        <ChevronDown className="w-5 h-5 text-black" strokeWidth={2.5} />
      </div>
    </button>
  )
}
