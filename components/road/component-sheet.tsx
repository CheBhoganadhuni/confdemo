'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Clock,
  CheckCircle2,
  Play,
  FileText,
  HelpCircle,
  Wrench,
  ExternalLink,
  Loader2,
  Sparkles,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ComponentWithProgress, Resource } from '@/lib/types/database'

interface ComponentSheetProps {
  component: ComponentWithProgress
  roadColor: string
  onClose: () => void
  onMarkComplete: (durationMinutes: number) => void
  dailyLimitReached: boolean
}

const resourceIcons: Record<string, React.ElementType> = {
  video: Play,
  article: FileText,
  doc: FileText,
  sheet: Wrench,
  course: HelpCircle,
}

export function ComponentSheet({
  component,
  roadColor,
  onClose,
  onMarkComplete,
  dailyLimitReached,
}: ComponentSheetProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)

  const isCompleted = component.progress_status === 'completed'

  const handleMarkComplete = async () => {
    if (dailyLimitReached || isCompleted) return

    setIsCompleting(true)

    try {
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component_id: component.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'daily_limit') {
          toast.error('Daily study limit reached (120 min). Come back tomorrow!')
        } else {
          toast.error(data.message ?? 'Failed to mark complete.')
        }
        return
      }

      setJustCompleted(true)

      if (data.xp_earned) {
        toast.success(`+${data.xp_earned} XP earned!`, { icon: '⚡' })
      }
      if (data.level_complete) {
        toast.success('Level complete! +50 XP bonus', { icon: '🎉' })
      }

      setTimeout(() => {
        onMarkComplete(component.duration_minutes ?? 0)
      }, 1500)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsCompleting(false)
    }
  }

  const totalDuration = (component.resources ?? []).reduce(
    (acc, r) => acc + (r.duration_minutes ?? 0), 0
  )

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />

      {/* Sheet */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0D0D0D] border-l border-[#1F1F1F] z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1F1F1F] p-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{component.title}</h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-[#555]">
              {(component.duration_minutes ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {Math.round((component.duration_minutes ?? 0) / 60 * 10) / 10}h
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {component.difficulty}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[#555] transition-colors hover:bg-[#1A1A1A] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {component.description && (
            <p className="text-sm text-[#A0A0A0]">{component.description}</p>
          )}

          {(component.resources?.length ?? 0) > 0 && (
            <div className="mt-6">
              <h4 className="text-[10px] uppercase tracking-wider text-[#555] mb-3">
                Resources{totalDuration > 0 ? ` · ${totalDuration} min total` : ''}
              </h4>
              <div className="space-y-2">
                {component.resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} roadColor={roadColor} />
                ))}
              </div>
            </div>
          )}

          {isCompleted && (
            <div
              className="mt-6 flex items-center gap-2 text-sm p-3 rounded-md"
              style={{
                backgroundColor: `color-mix(in srgb, ${roadColor} 10%, #111)`,
                color: roadColor,
              }}
            >
              <CheckCircle2 className="size-4" />
              <span>Component completed</span>
            </div>
          )}

          {dailyLimitReached && !isCompleted && (
            <div className="mt-6 flex items-center gap-2 text-sm p-3 rounded-md bg-[#F97316]/10 text-[#F97316]">
              <Clock className="size-4" />
              <span>Daily limit reached. Come back tomorrow!</span>
            </div>
          )}

          {justCompleted && (
            <motion.div
              className="mt-6 flex flex-col items-center justify-center gap-2 text-center py-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="size-8" style={{ color: roadColor }} />
              </motion.div>
              <p className="text-white font-bold text-lg">Excellent work!</p>
              <p className="text-[#555] text-sm">Keep going — you&apos;re building momentum.</p>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        {!isCompleted && !justCompleted && (
          <div className="border-t border-[#1F1F1F] p-4">
            <Button
              onClick={handleMarkComplete}
              disabled={isCompleting || dailyLimitReached}
              className="w-full h-11"
              style={{
                backgroundColor: dailyLimitReached ? '#333' : roadColor,
                color: dailyLimitReached ? '#555' : '#000',
              }}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Mark as Complete
                </>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </>
  )
}

interface ResourceCardProps {
  resource: Resource
  roadColor: string
}

function ResourceCard({ resource, roadColor }: ResourceCardProps) {
  const Icon = resourceIcons[resource.type] ?? ExternalLink

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-md border border-[#1F1F1F] bg-[#111] p-3 transition-colors hover:border-[#333] hover:bg-[#1A1A1A]"
    >
      <div
        className="flex size-9 items-center justify-center rounded"
        style={{ backgroundColor: `color-mix(in srgb, ${roadColor} 15%, #111)` }}
      >
        <Icon className="size-4" style={{ color: roadColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block truncate text-sm text-white group-hover:underline">{resource.title}</span>
        <span className="text-[10px] uppercase text-[#555]">
          {resource.type}
          {resource.duration_minutes ? ` · ${resource.duration_minutes} min` : ''}
        </span>
      </div>
      <ExternalLink className="size-3.5 shrink-0 text-[#333] transition-colors group-hover:text-[#555]" />
    </a>
  )
}
