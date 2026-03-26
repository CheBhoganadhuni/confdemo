'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Clock, 
  CheckCircle2, 
  Circle,
  ChevronDown,
  Play,
  FileText,
  HelpCircle,
  Wrench,
  ExternalLink,
  Loader2,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { 
  getComponentsForLevel, 
  type WorldLevel, 
  type LevelComponent,
  type ComponentResource 
} from '@/lib/data/mock-world'

interface LevelSheetProps {
  level: WorldLevel
  cityColor: string
  onClose: () => void
}

const resourceIcons: Record<string, React.ElementType> = {
  video: Play,
  article: FileText,
  quiz: HelpCircle,
  project: Wrench,
  external: ExternalLink,
}

export function LevelSheet({ level, cityColor, onClose }: LevelSheetProps) {
  const [components, setComponents] = useState<LevelComponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  
  // Fetch components when level changes
  useEffect(() => {
    setIsLoading(true)
    // Simulate API fetch
    const timer = setTimeout(() => {
      setComponents(getComponentsForLevel(level.id))
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [level.id])
  
  const completedCount = components.filter(c => c.completed).length
  const progressPercent = components.length > 0 
    ? Math.round((completedCount / components.length) * 100) 
    : 0
  
  // Handle component completion
  const handleMarkComplete = async (componentId: string) => {
    setCompletingId(componentId)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setComponents(prev => prev.map(c => 
      c.id === componentId ? { ...c, completed: true } : c
    ))
    setCompletingId(null)
  }
  
  return (
    <motion.div
      className="flex h-full flex-col bg-[#0D0D0D]"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#1F1F1F] p-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{level.name}</h3>
            <span className={cn(
              'rounded px-1.5 py-0.5 text-[10px] uppercase',
              level.difficulty === 'beginner' && 'bg-emerald-500/10 text-emerald-400',
              level.difficulty === 'intermediate' && 'bg-amber-500/10 text-amber-400',
              level.difficulty === 'advanced' && 'bg-red-500/10 text-red-400'
            )}>
              {level.difficulty}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-[#555]">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {Math.round(level.estimatedMinutes / 60 * 10) / 10}h
            </span>
            <span>{level.componentCount} components</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-[#555] transition-colors hover:bg-[#1A1A1A] hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="border-b border-[#1F1F1F] px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#555]">Progress</span>
          <span className="text-white">{completedCount}/{components.length} complete</span>
        </div>
        <Progress 
          value={progressPercent} 
          className="mt-2 h-1.5 bg-[#1F1F1F]"
          style={{ '--progress-color': cityColor } as React.CSSProperties}
        />
      </div>
      
      {/* Components list */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[#555]" />
          </div>
        ) : (
          <div className="space-y-2">
            {components.map((component, index) => (
              <ComponentItem
                key={component.id}
                component={component}
                index={index}
                cityColor={cityColor}
                isExpanded={expandedComponent === component.id}
                onToggle={() => setExpandedComponent(
                  expandedComponent === component.id ? null : component.id
                )}
                onMarkComplete={() => handleMarkComplete(component.id)}
                isCompleting={completingId === component.id}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface ComponentItemProps {
  component: LevelComponent
  index: number
  cityColor: string
  isExpanded: boolean
  onToggle: () => void
  onMarkComplete: () => void
  isCompleting: boolean
}

function ComponentItem({ 
  component, 
  index, 
  cityColor, 
  isExpanded, 
  onToggle,
  onMarkComplete,
  isCompleting
}: ComponentItemProps) {
  const [justCompleted, setJustCompleted] = useState(false)
  
  useEffect(() => {
    if (component.completed && !justCompleted) {
      setJustCompleted(true)
      const timer = setTimeout(() => setJustCompleted(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [component.completed, justCompleted])
  
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <motion.div
        className="overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#111]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-[#1A1A1A]">
            {/* Status */}
            <div className="shrink-0">
              <AnimatePresence mode="wait">
                {component.completed ? (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <CheckCircle2 
                      className="size-5" 
                      style={{ color: cityColor }} 
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="incomplete"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Circle className="size-5 text-[#333]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Title */}
            <div className="flex-1">
              <span className={cn(
                'text-sm font-medium',
                component.completed ? 'text-[#A0A0A0]' : 'text-white'
              )}>
                {component.name}
              </span>
            </div>
            
            {/* Expand icon */}
            <ChevronDown className={cn(
              'size-4 text-[#555] transition-transform',
              isExpanded && 'rotate-180'
            )} />
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t border-[#1F1F1F] p-3">
            {/* Description */}
            <p className="text-xs text-[#555]">{component.description}</p>
            
            {/* Resources */}
            <div className="mt-3 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-[#333]">
                Resources
              </span>
              <div className="grid gap-2">
                {component.resources.map((resource) => (
                  <ResourceCard 
                    key={resource.id} 
                    resource={resource} 
                    cityColor={cityColor}
                  />
                ))}
              </div>
            </div>
            
            {/* Complete button */}
            {!component.completed && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkComplete()
                }}
                disabled={isCompleting}
                className="mt-4 w-full"
                style={{ 
                  backgroundColor: cityColor,
                  color: '#000',
                }}
              >
                {isCompleting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 size-4" />
                )}
                Mark as Complete
              </Button>
            )}
            
            {/* Completed celebration */}
            {justCompleted && (
              <motion.div
                className="mt-3 flex items-center justify-center gap-2 text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ color: cityColor }}
              >
                <Sparkles className="size-4" />
                <span>Great work!</span>
              </motion.div>
            )}
          </div>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  )
}

interface ResourceCardProps {
  resource: ComponentResource
  cityColor: string
}

function ResourceCard({ resource, cityColor }: ResourceCardProps) {
  const Icon = resourceIcons[resource.type] || ExternalLink
  
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-md border border-[#1F1F1F] bg-[#0D0D0D] p-2.5 transition-colors hover:border-[#333] hover:bg-[#1A1A1A]"
    >
      <div 
        className="flex size-8 items-center justify-center rounded"
        style={{ backgroundColor: `color-mix(in srgb, ${cityColor} 15%, #111)` }}
      >
        <Icon className="size-4" style={{ color: cityColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block truncate text-sm text-white group-hover:underline">
          {resource.title}
        </span>
        <span className="text-[10px] uppercase text-[#555]">
          {resource.type}
          {resource.durationMinutes && ` • ${resource.durationMinutes} min`}
        </span>
      </div>
      <ExternalLink className="size-3.5 shrink-0 text-[#333] transition-colors group-hover:text-[#555]" />
    </a>
  )
}
