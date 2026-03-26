'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Layers, CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { LevelSheet } from './level-sheet'
import type { WorldCity, WorldLevel } from '@/lib/data/mock-world'

interface CityViewProps {
  city: WorldCity
  levels: WorldLevel[]
  onBack: () => void
}

export function CityView({ city, levels, onBack }: CityViewProps) {
  const [selectedLevel, setSelectedLevel] = useState<WorldLevel | null>(null)
  
  const totalMinutes = levels.reduce((sum, l) => sum + l.estimatedMinutes, 0)
  const totalHours = Math.round(totalMinutes / 60)
  const completedLevels = levels.filter(l => l.completionPercent === 100).length
  
  return (
    <div className="flex h-full" style={{ background: '#0A0A0A' }}>
      {/* Left Panel - City Info + Levels List */}
      <motion.div 
        className="flex w-80 flex-col border-r border-[#1F1F1F] bg-[#0D0D0D]"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 border-b border-[#1F1F1F] px-4 py-3 text-sm text-[#A0A0A0] transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          <span>Back to World</span>
        </button>
        
        {/* City header */}
        <div className="space-y-4 border-b border-[#1F1F1F] p-4">
          <div className="flex items-start gap-3">
            <div 
              className="flex size-12 items-center justify-center rounded-lg text-2xl"
              style={{ 
                backgroundColor: `color-mix(in srgb, ${city.themeColor} 15%, #111)`,
              }}
            >
              {city.icon}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-white">{city.name}</h2>
              <p className="text-xs text-[#555]">{city.description}</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <Layers className="size-3.5" />
              <span>{levels.length} levels</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <Clock className="size-3.5" />
              <span>{totalHours}h total</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <CheckCircle2 className="size-3.5" />
              <span>{completedLevels}/{levels.length}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#555]">Progress</span>
              <span className="text-white">{city.completionPercent}%</span>
            </div>
            <Progress 
              value={city.completionPercent} 
              className="h-1.5 bg-[#1F1F1F]"
              style={{ 
                '--progress-color': city.themeColor,
              } as React.CSSProperties}
            />
          </div>
        </div>
        
        {/* Levels list */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {levels.map((level, index) => {
              const isComplete = level.completionPercent === 100
              const isInProgress = level.completionPercent > 0 && level.completionPercent < 100
              const isLocked = index > 0 && levels[index - 1].completionPercent < 100 && level.completionPercent === 0
              
              return (
                <button
                  key={level.id}
                  onClick={() => !isLocked && setSelectedLevel(level)}
                  disabled={isLocked}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors',
                    isLocked 
                      ? 'cursor-not-allowed opacity-40' 
                      : 'hover:bg-[#1A1A1A]',
                    selectedLevel?.id === level.id && 'bg-[#1A1A1A]'
                  )}
                >
                  {/* Status icon */}
                  <div className="shrink-0">
                    {isComplete ? (
                      <CheckCircle2 
                        className="size-5" 
                        style={{ color: city.themeColor }} 
                      />
                    ) : isInProgress ? (
                      <div 
                        className="flex size-5 items-center justify-center rounded-full border-2"
                        style={{ borderColor: city.themeColor }}
                      >
                        <div 
                          className="size-2 rounded-full"
                          style={{ backgroundColor: city.themeColor }}
                        />
                      </div>
                    ) : (
                      <Circle className="size-5 text-[#333]" />
                    )}
                  </div>
                  
                  {/* Level info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-sm font-medium truncate',
                        isComplete ? 'text-[#A0A0A0]' : 'text-white'
                      )}>
                        {level.name}
                      </span>
                      <span className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase',
                        level.difficulty === 'beginner' && 'bg-emerald-500/10 text-emerald-400',
                        level.difficulty === 'intermediate' && 'bg-amber-500/10 text-amber-400',
                        level.difficulty === 'advanced' && 'bg-red-500/10 text-red-400'
                      )}>
                        {level.difficulty}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-[#555]">
                      <span>{Math.round(level.estimatedMinutes / 60 * 10) / 10}h</span>
                      <span>{level.componentCount} components</span>
                      {isInProgress && (
                        <span style={{ color: city.themeColor }}>
                          {level.completionPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Arrow */}
                  {!isLocked && (
                    <ChevronRight className="size-4 shrink-0 text-[#333] transition-colors group-hover:text-[#555]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
      
      {/* Right Panel - City overview or Level content */}
      <motion.div 
        className="relative flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, color-mix(in srgb, ${city.themeColor} 8%, transparent) 0%, transparent 70%)`,
          }}
        />
        
        {/* Content */}
        {!selectedLevel ? (
          // Empty state - city overview
          <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
            <div 
              className="mb-4 flex size-20 items-center justify-center rounded-2xl text-4xl"
              style={{ 
                backgroundColor: `color-mix(in srgb, ${city.themeColor} 15%, #111)`,
              }}
            >
              {city.icon}
            </div>
            <h3 className="text-xl font-semibold text-white">{city.name}</h3>
            <p className="mt-2 max-w-md text-sm text-[#555]">{city.description}</p>
            <p className="mt-6 text-xs text-[#333]">
              Select a level from the left to begin
            </p>
          </div>
        ) : (
          // Level sheet
          <LevelSheet 
            level={selectedLevel} 
            cityColor={city.themeColor}
            onClose={() => setSelectedLevel(null)} 
          />
        )}
      </motion.div>
    </div>
  )
}
