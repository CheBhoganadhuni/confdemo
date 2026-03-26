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
import type { WorldCity } from '@/lib/data/mock-world'

interface CityNodeProps {
  city: WorldCity
  onClick: () => void
  isFiltered?: boolean
}

export function CityNode({ city, onClick, isFiltered }: CityNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const sizeMap = {
    small: 60,
    normal: 72,
    large: 88,
  }
  const size = sizeMap[city.size]
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const completedLength = (city.completionPercent / 100) * circumference
  
  const isComplete = city.completionPercent === 100
  const hasProgress = city.completionPercent > 0
  
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
            <div 
              className="relative"
              style={{ width: size, height: size }}
            >
              {/* Glow effect for completed cities */}
              {isComplete && (
                <div 
                  className="absolute inset-0 rounded-full blur-md"
                  style={{ 
                    backgroundColor: city.themeColor,
                    opacity: 0.3,
                  }}
                />
              )}
              
              {/* Background circle */}
              <div 
                className={cn(
                  'absolute inset-0 rounded-full border-2 transition-colors',
                  hasProgress ? 'border-transparent' : 'border-[#333]'
                )}
                style={{
                  backgroundColor: isComplete 
                    ? `color-mix(in srgb, ${city.themeColor} 20%, #111)` 
                    : '#111',
                }}
              />
              
              {/* Progress ring */}
              <svg 
                className="absolute inset-0 -rotate-90"
                style={{ width: size, height: size }}
              >
                {/* Track */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#222"
                  strokeWidth={strokeWidth}
                />
                {/* Progress */}
                {hasProgress && (
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={city.themeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${completedLength} ${circumference}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}
              </svg>
              
              {/* Icon */}
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
                {city.name}
              </span>
              
              {/* Stats row */}
              <div className="flex items-center gap-2 text-[10px] text-[#555]">
                <span>{city.completionPercent}%</span>
                {city.activeUsers > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Users className="size-2.5" />
                    {city.activeUsers}
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        </TooltipTrigger>
        
        <TooltipContent 
          side="top" 
          className="max-w-xs border-[#1F1F1F] bg-[#111] p-3 text-white"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{city.icon}</span>
              <span className="font-medium">{city.name}</span>
            </div>
            <p className="text-xs text-[#A0A0A0]">{city.description}</p>
            <div className="flex gap-4 text-xs text-[#555]">
              <span>{city.levelCount} levels</span>
              <span>{city.estimatedHours}h total</span>
              {city.activeUsers > 0 && (
                <span>{city.activeUsers} active</span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
