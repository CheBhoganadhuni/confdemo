'use client'

import { useState, useEffect } from 'react'
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
  Diamond
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { ComponentSheet } from './component-sheet'
import { 
  type Road, 
  type RoadComponent, 
  type UserDailyProgress,
  getComponentsForRoad 
} from '@/lib/data/mock-roads'

// Icon mapping for roads
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
  road: Road
  dailyProgress: UserDailyProgress
}

export function RoadView({ road, dailyProgress }: RoadViewProps) {
  const [components, setComponents] = useState<RoadComponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedComponent, setSelectedComponent] = useState<RoadComponent | null>(null)
  const [todayMinutes, setTodayMinutes] = useState(dailyProgress.todayMinutes)

  const Icon = roadIcons[road.icon] || Layers
  const dailyLimitReached = todayMinutes >= dailyProgress.dailyLimit

  // Fetch components when road changes
  useEffect(() => {
    setIsLoading(true)
    // Simulate API fetch
    const timer = setTimeout(() => {
      setComponents(getComponentsForRoad(road.id))
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [road.id])

  const completedCount = components.filter(c => c.completed).length
  const progressPercent = components.length > 0 
    ? Math.round((completedCount / components.length) * 100) 
    : 0

  const totalHours = Math.round(components.reduce((acc, c) => acc + c.estimatedMinutes, 0) / 60)

  // Handle component completion
  const handleMarkComplete = async (componentId: string, timeSpent: number) => {
    // Update today's minutes
    setTodayMinutes(prev => Math.min(prev + timeSpent, dailyProgress.dailyLimit))
    
    // Update component status
    setComponents(prev => {
      const updated = prev.map(c => 
        c.id === componentId ? { ...c, completed: true, available: true } : c
      )
      // Make next component available
      const completedIndex = updated.findIndex(c => c.id === componentId)
      if (completedIndex < updated.length - 1) {
        updated[completedIndex + 1].available = true
      }
      return updated
    })
    
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
          <h1 className="font-black text-white text-xl sm:text-2xl">{road.name}</h1>
        </div>
        <p className="text-[#555] text-xs sm:text-sm mt-1">
          {components.length} components · ~{totalHours}h total · {progressPercent}% complete
        </p>
        {road.type === 'university' && road.creatorName && (
          <p className="text-[#F97316] text-xs mt-1">by {road.creatorName}</p>
        )}
        <Progress
          value={progressPercent}
          className="mt-3 h-1.5 bg-[#1F1F1F]"
          style={{ '--progress-color': road.color } as React.CSSProperties}
        />
      </header>

      {/* Component journey */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="size-5 animate-spin text-[#555]" />
          </div>
        ) : (
          <div className="relative">
            {/* Vertical spine */}
            <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-[#1F1F1F]" />

            {/* Components */}
            {components.map((component, index) => (
              <ComponentStop
                key={component.id}
                component={component}
                index={index}
                roadColor={road.color}
                isLast={index === components.length - 1}
                previousCompleted={index === 0 || components[index - 1].completed}
                onSelect={() => setSelectedComponent(component)}
                dailyLimitReached={dailyLimitReached}
              />
            ))}

            {/* Road complete marker */}
            {completedCount === components.length && components.length > 0 && (
              <motion.div 
                className="flex items-center gap-3 ml-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Diamond className="size-8 text-[#F97316] fill-[#F97316]" />
                <span className="text-[#F97316] text-[10px] tracking-widest font-bold">
                  ROAD COMPLETE
                </span>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Today's progress bar - sticky bottom */}
      <div className="sticky bottom-0 border-t border-[#1F1F1F] bg-[#0A0A0A] px-4 sm:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <span className="text-white text-xs font-bold">
            Today: {todayMinutes} / {dailyProgress.dailyLimit} min
          </span>
          {dailyLimitReached && (
            <span className="text-[#F97316] text-xs">
              Daily limit reached
            </span>
          )}
        </div>
        <Progress 
          value={(todayMinutes / dailyProgress.dailyLimit) * 100} 
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
            onMarkComplete={(timeSpent) => handleMarkComplete(selectedComponent.id, timeSpent)}
            dailyLimitReached={dailyLimitReached}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface ComponentStopProps {
  component: RoadComponent
  index: number
  roadColor: string
  isLast: boolean
  previousCompleted: boolean
  onSelect: () => void
  dailyLimitReached: boolean
}

function ComponentStop({ 
  component, 
  index, 
  roadColor, 
  isLast,
  previousCompleted,
  onSelect,
  dailyLimitReached
}: ComponentStopProps) {
  const isAvailableNext = component.available && !component.completed && previousCompleted

  return (
    <motion.div
      className="relative flex items-start gap-4 mb-2 group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Spine segment - colored if completed */}
      {!isLast && (
        <div 
          className="absolute left-[17px] top-9 w-0.5 h-[calc(100%-8px)]"
          style={{ 
            backgroundColor: component.completed ? roadColor : '#1F1F1F' 
          }}
        />
      )}

      {/* Stop indicator */}
      <div className="relative z-10 shrink-0">
        <StopIndicator 
          completed={component.completed}
          available={component.available}
          isAvailableNext={isAvailableNext}
          roadColor={roadColor}
        />
      </div>

      {/* Content card */}
      <button
        onClick={onSelect}
        disabled={!component.available && !component.completed}
        className={cn(
          'flex-1 text-left py-3 px-4 rounded-sm transition-colors border border-transparent',
          component.available || component.completed
            ? 'cursor-pointer hover:bg-[#111] group-hover:border-[#333]'
            : 'cursor-not-allowed opacity-50',
          component.completed && 'border-l-2',
          isAvailableNext && 'animate-pulse bg-[#F97316]/[0.03]'
        )}
        style={{ 
          borderLeftColor: component.completed ? roadColor : undefined 
        }}
      >
        <h3 className="text-white text-sm font-medium">{component.name}</h3>
        <div className="flex items-center gap-2 mt-0.5 text-[#555] text-xs">
          <Clock className="size-3" />
          <span>{Math.round(component.estimatedMinutes / 60 * 10) / 10}h</span>
          {component.cityName && (
            <>
              <span>·</span>
              <span>{component.cityName}</span>
            </>
          )}
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
  const baseClasses = 'size-9 rounded-full flex items-center justify-center'

  if (completed) {
    return (
      <motion.div 
        className={cn(baseClasses, 'border-2')}
        style={{ 
          backgroundColor: `color-mix(in srgb, ${roadColor} 20%, #0D0D0D)`,
          borderColor: roadColor 
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
        className={cn(baseClasses, 'border-2 border-[#F97316] bg-[#F97316]/10')}
        animate={{ 
          boxShadow: ['0 0 0 0 rgba(249,115,22,0)', '0 0 0 4px rgba(249,115,22,0.2)', '0 0 0 0 rgba(249,115,22,0)'] 
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Play className="size-4 text-[#F97316] ml-0.5" />
      </motion.div>
    )
  }

  if (available) {
    return (
      <div className={cn(baseClasses, 'border-2 border-[#F97316] bg-[#0D0D0D]')}>
        <Play className="size-4 text-[#F97316] ml-0.5" />
      </div>
    )
  }

  return (
    <div className={cn(baseClasses, 'border-2 border-[#2A2A2A] bg-[#0D0D0D]')}>
      <Circle className="size-4 text-[#2A2A2A]" />
    </div>
  )
}
