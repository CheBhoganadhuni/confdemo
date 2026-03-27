'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import type { WorldCityMapped } from './world-map-client'

interface CityNodeProps {
  city: WorldCityMapped
  onClick: () => void
  isFiltered?: boolean
  isMobile?: boolean
}

export function CityNode({ city, onClick, isFiltered, isMobile }: CityNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeMap = { small: isMobile ? 48 : 56, normal: isMobile ? 56 : 68, large: isMobile ? 68 : 84 }
  const size = sizeMap[city.size]
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const completedLength = (city.completion_percent / 100) * circumference
  const iconSize = Math.round(size * 0.38)

  const pct = city.completion_percent
  const isComplete = pct === 100
  const hasProgress = pct > 0
  const isInProgress = hasProgress && !isComplete
  const isAlmostDone = pct >= 70 && pct < 100
  const count = city.active_student_count
  const countDisplay = count > 99 ? '99+' : String(count)

  // Derive total/remaining components from levels for tooltip
  const totalComponents = city.levels.reduce((s, l) => s + l.total_count, 0)
  const completedComponents = city.levels.reduce((s, l) => s + l.completed_count, 0)
  const remainingComponents = totalComponents - completedComponents

  // Context-aware tooltip line 3
  const psychLine = (() => {
    if (isComplete) return { text: '✓ Complete', color: '#34d399' }
    if (isAlmostDone) return { text: `⚡ ${remainingComponents} topic${remainingComponents !== 1 ? 's' : ''} left!`, color: '#F97316' }
    if (hasProgress) return { text: `${pct}% complete`, color: city.color }
    if (count > 0) return { text: `${countDisplay} students here this week`, color: '#F97316' }
    return { text: 'Start this city', color: '#555' }
  })()

  return (
    <motion.button
      data-city-node
      className={cn(
        'absolute flex flex-col items-center focus:outline-none group',
        isFiltered && 'pointer-events-none'
      )}
      style={{
        left: city.position.left,
        top: city.position.top,
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered ? 10 : 1,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isFiltered ? 0.12 : 1,
        scale: isHovered ? 1.08 : 1,
      }}
      transition={{ duration: 0.15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Desktop hover tooltip */}
      {isHovered && !isMobile && (
        <div className="absolute bottom-full mb-3 z-50 pointer-events-none whitespace-nowrap bg-[#111] border border-[#1F1F1F] rounded-sm px-3 py-2 shadow-xl">
          <div className="font-bold text-white text-xs mb-0.5">{city.title}</div>
          <div className="text-[#A0A0A0] text-[10px]">
            {city.total_levels} levels · ~{city.estimated_hours}h
          </div>
          <div className="text-[10px] mt-0.5 font-medium" style={{ color: psychLine.color }}>
            {psychLine.text}
          </div>
        </div>
      )}

      {/* Node */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer glow — pulsing when in progress, solid when complete */}
        {hasProgress && (
          <div
            className={cn(
              'absolute rounded-full pointer-events-none',
              isInProgress && 'animate-pulse'
            )}
            style={{
              inset: -12,
              background: `radial-gradient(circle, ${city.color}28 0%, transparent 70%)`,
            }}
          />
        )}

        {/* SVG completion ring */}
        <svg className="absolute inset-0 -rotate-90" style={{ width: size, height: size }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A1A1A" strokeWidth={strokeWidth} />
          {hasProgress && (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={city.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${completedLength} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          )}
        </svg>

        {/* Node body */}
        <div
          className="absolute rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            inset: strokeWidth,
            backgroundColor: isComplete
              ? `color-mix(in srgb, ${city.color} 15%, #0F0F0F)`
              : '#0F0F0F',
            border: `2px solid ${
              isComplete ? city.color
              : hasProgress ? city.color + '80'
              : '#252525'
            }`,
            boxShadow: isComplete
              ? `0 0 20px ${city.color}50, inset 0 0 10px ${city.color}15`
              : isHovered
              ? `0 0 12px ${city.color}30`
              : undefined,
          }}
        >
          <DynamicIcon
            name={city.icon}
            size={iconSize}
            color={hasProgress ? city.color : '#3A3A3A'}
          />
        </div>
      </div>

      {/* Labels */}
      <div className="flex flex-col items-center mt-2 gap-0.5">
        <span
          className={cn(
            'text-[11px] font-bold text-center leading-tight max-w-[90px] truncate transition-colors',
            isHovered ? 'text-white'
            : isComplete ? 'text-[#D0D0D0]'
            : hasProgress ? 'text-[#A0A0A0]'
            : 'text-[#555]'
          )}
        >
          {city.title}
        </span>

        {/* Active student count pill — desktop and mobile */}
        {count > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 mt-0.5"
            style={{
              backgroundColor: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.28)',
            }}
          >
            <Users className="size-2" style={{ color: '#F97316' }} />
            <span className="text-[9px] font-semibold" style={{ color: '#F97316' }}>
              {countDisplay}
            </span>
          </span>
        )}

        {/* Completion % (only when has progress, no count pill overlap) */}
        {hasProgress && count === 0 && (
          <span className="text-[9px] font-medium" style={{ color: city.color + 'CC' }}>
            {pct}%
          </span>
        )}
      </div>
    </motion.button>
  )
}
