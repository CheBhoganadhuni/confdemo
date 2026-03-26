'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { WorldCityMapped } from './world-map-client'

interface CityNodeProps {
  city: WorldCityMapped
  onClick: () => void
  isFiltered?: boolean
}

export function CityNode({ city, onClick, isFiltered }: CityNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeMap = { small: 60, normal: 72, large: 88 }
  const size = sizeMap[city.size]
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const completedLength = (city.completion_percent / 100) * circumference

  const isComplete = city.completion_percent === 100
  const hasProgress = city.completion_percent > 0

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <motion.button
            data-city-node
            className={cn(
              'absolute flex flex-col items-center gap-2 focus:outline-none',
              isFiltered && 'pointer-events-none'
            )}
            style={{
              left: city.position.left,
              top: city.position.top,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isFiltered ? 0.2 : 1,
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
          >
            {/* Node circle with progress ring */}
            <div className="relative" style={{ width: size, height: size }}>
              {isComplete && (
                <div
                  className="absolute inset-0 rounded-full blur-md"
                  style={{ backgroundColor: city.color, opacity: 0.3 }}
                />
              )}

              <div
                className={cn(
                  'absolute inset-0 rounded-full border-2 transition-colors',
                  hasProgress ? 'border-transparent' : 'border-[#333]'
                )}
                style={{
                  backgroundColor: isComplete
                    ? `color-mix(in srgb, ${city.color} 20%, #111)`
                    : '#111',
                }}
              />

              <svg className="absolute inset-0 -rotate-90" style={{ width: size, height: size }}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#222"
                  strokeWidth={strokeWidth}
                />
                {hasProgress && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={city.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${completedLength} ${circumference}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}
              </svg>

              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center text-2xl transition-opacity',
                  !hasProgress && 'opacity-40'
                )}
                style={{ fontSize: size * 0.35 }}
              >
                {city.icon}
              </span>
            </div>

            {/* City name */}
            <div className="flex flex-col items-center gap-0.5">
              <span
                className={cn(
                  'whitespace-nowrap text-xs font-medium transition-colors',
                  isHovered ? 'text-white' : 'text-[#A0A0A0]'
                )}
              >
                {city.title}
              </span>

              <div className="flex items-center gap-2 text-[10px] text-[#555]">
                <span>{city.completion_percent}%</span>
                {city.active_student_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Users className="size-2.5" />
                    {city.active_student_count}
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        </TooltipTrigger>

        <TooltipContent side="top" className="max-w-xs border-[#1F1F1F] bg-[#111] p-3 text-white">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{city.icon}</span>
              <span className="font-medium">{city.title}</span>
            </div>
            <p className="text-xs text-[#A0A0A0]">{city.description}</p>
            <div className="flex gap-4 text-xs text-[#555]">
              <span>{city.total_levels} levels</span>
              <span>{city.estimated_hours}h total</span>
              {city.active_student_count > 0 && (
                <span>{city.active_student_count} active</span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
