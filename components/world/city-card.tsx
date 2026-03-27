'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Layers, Clock, Users, Zap, CheckCircle } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import type { WorldCityMapped } from './world-map-client'

interface CityCardProps {
  city: WorldCityMapped | null
  isMobile: boolean
  onClose: () => void
  onExplore: (city: WorldCityMapped) => void
}

function CityCardContent({
  city,
  onClose,
  onExplore,
}: {
  city: WorldCityMapped
  onClose: () => void
  onExplore: (city: WorldCityMapped) => void
}) {
  const totalComponents = city.levels.reduce((s, l) => s + l.total_count, 0)
  const completedComponents = city.levels.reduce((s, l) => s + l.completed_count, 0)
  const remaining = totalComponents - completedComponents
  const pct = city.completion_percent
  const isComplete = pct === 100
  const isAlmostDone = pct >= 70 && pct < 100
  const isInProgress = pct > 0 && pct < 70
  const notStarted = pct === 0
  const count = city.active_student_count
  const countDisplay = count > 99 ? '99+' : String(count)

  return (
    <>
      {/* Drag handle (mobile only visual hint) */}
      <div className="flex justify-center pt-3 pb-1 md:hidden">
        <div className="w-8 h-1 rounded-full bg-[#2A2A2A]" />
      </div>

      {/* Header */}
      <div
        className="relative px-5 pt-4 pb-5"
        style={{
          background: `linear-gradient(135deg, ${city.color}22 0%, transparent 55%)`,
        }}
      >
        {/* Decorative background icon */}
        <div
          className="absolute right-0 top-0 pointer-events-none select-none"
          style={{ opacity: 0.07 }}
          aria-hidden
        >
          <DynamicIcon name={city.icon} size={110} color={city.color} />
        </div>

        {/* Close button — z-10 so it's above the decorative icon */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="absolute right-3 top-3 z-10 text-[#444] hover:text-white transition-colors p-1.5 rounded-sm hover:bg-[#1A1A1A]"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* City icon + name */}
        <div className="flex items-center gap-3 relative z-[1] pr-8">
          <div
            className="flex size-11 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: `color-mix(in srgb, ${city.color} 20%, #111)` }}
          >
            <DynamicIcon name={city.icon} size={22} color={city.color} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-tight">{city.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-sm"
                style={{
                  backgroundColor: `color-mix(in srgb, ${city.color} 18%, transparent)`,
                  color: city.color,
                }}
              >
                {city.difficulty}
              </span>
              <span className="text-[#555] text-[10px]">~{city.estimated_hours}h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 px-5 py-3 border-t border-b border-[#1A1A1A]">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3.5 text-[#555]" />
          <span className="text-[#A0A0A0] text-xs">{city.total_levels} levels</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-[#555]" />
          <span className="text-[#A0A0A0] text-xs">~{city.estimated_hours}h total</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="16" className="-rotate-90" aria-hidden>
            <circle cx="8" cy="8" r="6" fill="none" stroke="#1A1A1A" strokeWidth="2.5" />
            {pct > 0 && (
              <circle
                cx="8" cy="8" r="6"
                fill="none"
                stroke={city.color}
                strokeWidth="2.5"
                strokeDasharray={`${(pct / 100) * 37.7} 37.7`}
                strokeLinecap="round"
              />
            )}
          </svg>
          <span className="text-[#A0A0A0] text-xs">{pct}% done</span>
        </div>
      </div>

      {/* Psychology section */}
      <div className="px-5 py-4">
        {notStarted && count > 0 && (
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-[#F97316] shrink-0" />
            <span className="text-[#F97316] text-sm font-medium">
              {countDisplay} student{count !== 1 ? 's' : ''} from your college exploring this
            </span>
          </div>
        )}
        {notStarted && count === 0 && (
          <p className="text-[#555] text-sm leading-relaxed">{city.description}</p>
        )}
        {isInProgress && (
          <div>
            <p className="text-[#A0A0A0] text-sm leading-relaxed">{city.description}</p>
            {count > 0 && (
              <p className="text-[#555] text-xs mt-2">{countDisplay} others here this week</p>
            )}
          </div>
        )}
        {isAlmostDone && (
          <div
            className="rounded-sm p-3 border"
            style={{
              backgroundColor: 'rgba(249,115,22,0.08)',
              borderColor: 'rgba(249,115,22,0.25)',
            }}
          >
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-[#F97316] shrink-0" />
              <span className="text-[#F97316] font-bold text-sm">You&apos;re {pct}% done</span>
            </div>
            <p className="text-[#A0A0A0] text-xs mt-1.5">
              {remaining} topic{remaining !== 1 ? 's' : ''} left to complete this city.
            </p>
          </div>
        )}
        {isComplete && (
          <div className="rounded-sm p-3 border border-emerald-500/30 bg-emerald-500/10">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-bold text-sm">City complete!</span>
            </div>
            <p className="text-[#A0A0A0] text-xs mt-1">{city.title} fully explored.</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 pb-6 pt-1">
        <button
          onClick={() => onExplore(city)}
          className="w-full h-12 bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold text-sm rounded-sm flex items-center justify-center transition-colors duration-200"
        >
          {isComplete ? 'Review City →' : 'Explore City →'}
        </button>
      </div>
    </>
  )
}

export function CityCard({ city, isMobile, onClose, onExplore }: CityCardProps) {
  return (
    <AnimatePresence>
      {city && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {isMobile ? (
            /* ── Mobile: slide up from bottom ── */
            <motion.div
              key="sheet-mobile"
              className="absolute bottom-0 left-0 right-0 z-30 bg-[#0F0F0F] border-t border-[#1F1F1F] rounded-t-2xl overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            >
              <CityCardContent city={city} onClose={onClose} onExplore={(c) => { onExplore(c); onClose() }} />
            </motion.div>
          ) : (
            /* ── Desktop: centered dialog ── */
            <motion.div
              key="card-desktop"
              className="absolute z-30 w-full max-w-md bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm shadow-2xl overflow-hidden"
              style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <CityCardContent city={city} onClose={onClose} onExplore={(c) => { onExplore(c); onClose() }} />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
