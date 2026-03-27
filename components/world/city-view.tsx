'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, Layers, CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { LevelSheet } from './level-sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { useBackButtonClose } from '@/hooks/use-back-button-close'
import type { WorldCityMapped } from './world-map-client'
import type { LevelWithProgress } from '@/lib/types/database'

interface CityViewProps {
  city: WorldCityMapped
  levels: LevelWithProgress[]
  onBack: () => void
}

export function CityView({ city, levels, onBack }: CityViewProps) {
  const [selectedLevel, setSelectedLevel] = useState<LevelWithProgress | null>(null)
  const isMobile = useIsMobile()

  // Back-swipe closes the level sheet before leaving the city view
  useBackButtonClose(selectedLevel !== null, () => setSelectedLevel(null))

  const totalHours = levels.reduce((sum, l) => sum + (l.estimated_hours ?? 0), 0)
  const completedLevels = levels.filter(l => l.completion_percent === 100).length

  const levelList = (
    <div className="p-2">
      {levels.map((level, index) => {
        const isComplete = level.completion_percent === 100
        const isInProgress = level.completion_percent > 0 && level.completion_percent < 100
        const isLocked = index > 0 && levels[index - 1].completion_percent < 100 && level.completion_percent === 0

        return (
          <button
            key={level.id}
            onClick={() => !isLocked && setSelectedLevel(level)}
            disabled={isLocked}
            className={cn(
              'group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors',
              isLocked ? 'cursor-not-allowed opacity-40' : 'hover:bg-[#1A1A1A] active:bg-[#1A1A1A]',
              selectedLevel?.id === level.id && 'bg-[#1A1A1A]'
            )}
          >
            <div className="shrink-0">
              {isComplete ? (
                <CheckCircle2 className="size-5" style={{ color: city.color }} />
              ) : isInProgress ? (
                <div
                  className="flex size-5 items-center justify-center rounded-full border-2"
                  style={{ borderColor: city.color }}
                >
                  <div className="size-2 rounded-full" style={{ backgroundColor: city.color }} />
                </div>
              ) : (
                <Circle className="size-5 text-[#333]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium truncate', isComplete ? 'text-[#A0A0A0]' : 'text-white')}>
                  {level.title}
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
                {level.estimated_hours > 0 && <span>{level.estimated_hours}h</span>}
                <span>{level.total_count} components</span>
                {isInProgress && (
                  <span style={{ color: city.color }}>{level.completion_percent}%</span>
                )}
              </div>
            </div>

            {!isLocked && (
              <ChevronRight className="size-4 shrink-0 text-[#333] transition-colors group-hover:text-[#555]" />
            )}
          </button>
        )
      })}
    </div>
  )

  if (isMobile) {
    return (
      <div className="flex flex-col h-full" style={{ background: '#0A0A0A' }}>
        <button
          onClick={selectedLevel ? () => setSelectedLevel(null) : onBack}
          className="flex items-center gap-2 border-b border-[#1F1F1F] px-4 py-3 text-sm text-[#A0A0A0] transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          <span>{selectedLevel ? 'Back to Levels' : 'Back to World'}</span>
        </button>

        <div className="space-y-3 border-b border-[#1F1F1F] p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, ${city.color} 15%, #111)` }}
            >
              <DynamicIcon name={city.icon} size={20} color={city.color} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white">{city.title}</h2>
              <p className="text-xs text-[#555] line-clamp-2">{city.description}</p>
            </div>
          </div>

          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <Layers className="size-3.5" />
              <span>{levels.length} levels</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <Clock className="size-3.5" />
              <span>{Math.round(totalHours)}h</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <CheckCircle2 className="size-3.5" />
              <span>{completedLevels}/{levels.length}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#555]">Progress</span>
              <span className="text-white">{city.completion_percent}%</span>
            </div>
            <Progress
              value={city.completion_percent}
              className="h-1.5 bg-[#1F1F1F]"
              style={{ '--progress-color': city.color } as React.CSSProperties}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {levelList}
        </div>

        <AnimatePresence>
        {selectedLevel && (
          <motion.div
            className="absolute inset-0 z-20 bg-[#0D0D0D]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-[#1F1F1F] px-4 py-3">
              <button
                onClick={() => setSelectedLevel(null)}
                className="text-sm text-[#A0A0A0] flex items-center gap-2"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
            </div>
            <div className="h-[calc(100%-49px)] overflow-y-auto">
              <LevelSheet
                level={selectedLevel}
                cityColor={city.color}
                onClose={() => setSelectedLevel(null)}
              />
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    )
  }

  // Desktop: two-panel layout
  return (
    <div className="flex h-full" style={{ background: '#0A0A0A' }}>
      <motion.div
        className="flex w-80 flex-col border-r border-[#1F1F1F] bg-[#0D0D0D]"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <button
          onClick={selectedLevel ? () => setSelectedLevel(null) : onBack}
          className="flex items-center gap-2 border-b border-[#1F1F1F] px-4 py-3 text-sm text-[#A0A0A0] transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          <span>{selectedLevel ? 'Back to Levels' : 'Back to World'}</span>
        </button>

        <div className="space-y-4 border-b border-[#1F1F1F] p-4">
          <div className="flex items-start gap-3">
            <div
              className="flex size-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, ${city.color} 15%, #111)` }}
            >
              <DynamicIcon name={city.icon} size={24} color={city.color} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-white">{city.title}</h2>
              <p className="text-xs text-[#555]">{city.description}</p>
            </div>
          </div>

          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <Layers className="size-3.5" />
              <span>{levels.length} levels</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <Clock className="size-3.5" />
              <span>{Math.round(totalHours)}h total</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#A0A0A0]">
              <CheckCircle2 className="size-3.5" />
              <span>{completedLevels}/{levels.length}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#555]">Progress</span>
              <span className="text-white">{city.completion_percent}%</span>
            </div>
            <Progress
              value={city.completion_percent}
              className="h-1.5 bg-[#1F1F1F]"
              style={{ '--progress-color': city.color } as React.CSSProperties}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {levelList}
        </div>
      </motion.div>

      <motion.div
        className="relative flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, color-mix(in srgb, ${city.color} 8%, transparent) 0%, transparent 70%)`,
          }}
        />

        {!selectedLevel ? (
          <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
            <div
              className="mb-4 flex size-20 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `color-mix(in srgb, ${city.color} 15%, #111)` }}
            >
              <DynamicIcon name={city.icon} size={36} color={city.color} />
            </div>
            <h3 className="text-xl font-semibold text-white">{city.title}</h3>
            <p className="mt-2 max-w-md text-sm text-[#555]">{city.description}</p>
            <p className="mt-6 text-xs text-[#333]">Select a level from the left to begin</p>
          </div>
        ) : (
          <LevelSheet
            level={selectedLevel}
            cityColor={city.color}
            onClose={() => setSelectedLevel(null)}
          />
        )}
      </motion.div>
    </div>
  )
}
