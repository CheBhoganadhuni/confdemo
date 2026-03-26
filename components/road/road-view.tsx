'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  Play,
  Circle,
  Clock,
  Layers,
  Database,
  Cpu,
  Brain,
  GraduationCap,
  Globe,
  Target,
  Loader2,
  Diamond,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { ComponentSheet } from './component-sheet'
import type { RoadWithProgress, ComponentWithProgress } from '@/lib/types/database'

const roadIcons: Record<string, React.ElementType> = {
  Layers,
  Database,
  Cpu,
  Brain,
  GraduationCap,
  Globe,
  Target,
}

interface RoadViewProps {
  road: RoadWithProgress
  todayMinutes: number
  onMinutesUpdate: (add: number) => void
}

const DAILY_LIMIT = 120

export function RoadView({ road, todayMinutes, onMinutesUpdate }: RoadViewProps) {
  const [components, setComponents] = useState<ComponentWithProgress[]>(road.components)
  const [selectedComponent, setSelectedComponent] = useState<ComponentWithProgress | null>(null)

  const Icon = roadIcons[road.icon] ?? Layers
  const dailyLimitReached = todayMinutes >= DAILY_LIMIT

  const completedCount = components.filter(c => c.progress_status === 'completed').length
  const progressPercent = components.length > 0
    ? Math.round((completedCount / components.length) * 100)
    : 0
  const totalHours = Math.round(
    components.reduce((acc, c) => acc + (c.duration_minutes ?? 0), 0) / 60
  )

  const handleMarkComplete = (componentId: string, durationMinutes: number) => {
    onMinutesUpdate(durationMinutes)
    setComponents(prev =>
      prev.map(c =>
        c.id === componentId
          ? { ...c, progress_status: 'completed' as const, completed_at: new Date().toISOString() }
          : c
      )
    )
    setSelectedComponent(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Road header */}
      <header className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-[#1F1F1F]">
        <div className="flex items-center gap-3">
          <Icon className="size-5 sm:size-6" style={{ color: road.color }} />
          <h1 className="font-black text-white text-xl sm:text-2xl">{road.title}</h1>
        </div>
        <p className="text-[#555] text-xs sm:text-sm mt-1">
          {components.length} components · ~{totalHours}h total · {progressPercent}% complete
        </p>
        <Progress
          value={progressPercent}
          className="mt-3 h-1.5 bg-[#1F1F1F]"
          style={{ '--progress-color': road.color } as React.CSSProperties}
        />
      </header>

      {/* Component journey */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-24">
        <div className="relative">
          <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-[#1F1F1F]" />

          {components.map((component, index) => {
            const isCompleted = component.progress_status === 'completed'
            const previousCompleted = index === 0 || components[index - 1].progress_status === 'completed'
            const available = isCompleted || previousCompleted

            return (
              <ComponentStop
                key={component.id}
                component={component}
                index={index}
                roadColor={road.color}
                isLast={index === components.length - 1}
                available={available}
                onSelect={() => setSelectedComponent(component)}
                dailyLimitReached={dailyLimitReached}
              />
            )
          })}

          {completedCount === components.length && components.length > 0 && (
            <motion.div
              className="flex items-center gap-3 ml-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Diamond className="size-8 text-[#F97316] fill-[#F97316]" />
              <span className="text-[#F97316] text-[10px] tracking-widest font-bold">ROAD COMPLETE</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Today's progress bar */}
      <div className="sticky bottom-0 border-t border-[#1F1F1F] bg-[#0A0A0A] px-4 sm:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <span className="text-white text-xs font-bold">
            Today: {todayMinutes} / {DAILY_LIMIT} min
          </span>
          {dailyLimitReached && (
            <span className="text-[#F97316] text-xs">Daily limit reached</span>
          )}
        </div>
        <Progress
          value={(todayMinutes / DAILY_LIMIT) * 100}
          className="mt-2 h-1.5 bg-[#1F1F1F]"
          style={{ '--progress-color': '#F97316' } as React.CSSProperties}
        />
      </div>

      {/* Component Sheet */}
      <AnimatePresence>
        {selectedComponent && (
          <ComponentSheet
            component={selectedComponent}
            roadColor={road.color}
            onClose={() => setSelectedComponent(null)}
            onMarkComplete={(durationMinutes) =>
              handleMarkComplete(selectedComponent.id, durationMinutes)
            }
            dailyLimitReached={dailyLimitReached}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface ComponentStopProps {
  component: ComponentWithProgress
  index: number
  roadColor: string
  isLast: boolean
  available: boolean
  onSelect: () => void
  dailyLimitReached: boolean
}

function ComponentStop({
  component,
  index,
  roadColor,
  isLast,
  available,
  onSelect,
  dailyLimitReached,
}: ComponentStopProps) {
  const isCompleted = component.progress_status === 'completed'
  const isAvailableNext = available && !isCompleted

  return (
    <motion.div
      className="relative flex items-start gap-4 mb-2 group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {!isLast && (
        <div
          className="absolute left-[17px] top-9 w-0.5 h-[calc(100%-8px)]"
          style={{ backgroundColor: isCompleted ? roadColor : '#1F1F1F' }}
        />
      )}

      <div className="relative z-10 shrink-0">
        <StopIndicator
          completed={isCompleted}
          available={available}
          isAvailableNext={isAvailableNext}
          roadColor={roadColor}
        />
      </div>

      <button
        onClick={onSelect}
        disabled={!available}
        className={cn(
          'flex-1 text-left py-3 px-4 rounded-sm transition-colors border border-transparent',
          available
            ? 'cursor-pointer hover:bg-[#111] group-hover:border-[#333]'
            : 'cursor-not-allowed opacity-50',
          isCompleted && 'border-l-2',
          isAvailableNext && 'animate-pulse bg-[#F97316]/[0.03]'
        )}
        style={{ borderLeftColor: isCompleted ? roadColor : undefined }}
      >
        <h3 className="text-white text-sm font-medium">{component.title}</h3>
        <div className="flex items-center gap-2 mt-0.5 text-[#555] text-xs">
          <Clock className="size-3" />
          <span>{Math.round((component.duration_minutes ?? 0) / 60 * 10) / 10}h</span>
        </div>
      </button>
    </motion.div>
  )
}

interface StopIndicatorProps {
  completed: boolean
  available: boolean
  isAvailableNext: boolean
  roadColor: string
}

function StopIndicator({ completed, available, isAvailableNext, roadColor }: StopIndicatorProps) {
  const base = 'size-9 rounded-full flex items-center justify-center'

  if (completed) {
    return (
      <motion.div
        className={cn(base, 'border-2')}
        style={{
          backgroundColor: `color-mix(in srgb, ${roadColor} 20%, #0D0D0D)`,
          borderColor: roadColor,
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        <Check className="size-4" style={{ color: roadColor }} />
      </motion.div>
    )
  }

  if (isAvailableNext) {
    return (
      <motion.div
        className={cn(base, 'border-2 border-[#F97316] bg-[#F97316]/10')}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(249,115,22,0)',
            '0 0 0 4px rgba(249,115,22,0.2)',
            '0 0 0 0 rgba(249,115,22,0)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Play className="size-4 text-[#F97316] ml-0.5" />
      </motion.div>
    )
  }

  if (available) {
    return (
      <div className={cn(base, 'border-2 border-[#F97316] bg-[#0D0D0D]')}>
        <Play className="size-4 text-[#F97316] ml-0.5" />
      </div>
    )
  }

  return (
    <div className={cn(base, 'border-2 border-[#2A2A2A] bg-[#0D0D0D]')}>
      <Circle className="size-4 text-[#2A2A2A]" />
    </div>
  )
}

// Keep Loader2 imported even if not directly used in JSX (used by road-page-client)
export { Loader2 }
