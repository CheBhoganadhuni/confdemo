'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ChevronRight,
  Plus,
  Menu,
  X,
  Layers,
  Database,
  Cpu,
  Brain,
  GraduationCap,
  Globe,
  Target,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { RoadView } from './road-view'
import type { RoadWithProgress } from '@/lib/types/database'

export interface RoadSummary {
  id: string
  slug: string
  title: string
  description?: string
  color: string
  icon: string
  type: 'preset' | 'university' | 'custom'
  is_published: boolean
  component_count: number
  total_duration_minutes: number
  completion_percent: number
  completed_count: number
}

const roadIcons: Record<string, React.ElementType> = {
  Layers,
  Database,
  Cpu,
  Brain,
  GraduationCap,
  Globe,
  Target,
}

interface RoadPageClientProps {
  presetRoads: RoadSummary[]
  universityRoads: RoadSummary[]
  customRoads: RoadSummary[]
  todayMinutes: number
}

type TabType = 'presets' | 'university' | 'mine'

export function RoadPageClient({
  presetRoads,
  universityRoads,
  customRoads,
  todayMinutes: initialTodayMinutes,
}: RoadPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('presets')
  const [selectedSummary, setSelectedSummary] = useState<RoadSummary | null>(null)
  const [roadDetail, setRoadDetail] = useState<RoadWithProgress | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [todayMinutes, setTodayMinutes] = useState(initialTodayMinutes)

  const currentRoads =
    activeTab === 'presets' ? presetRoads :
    activeTab === 'university' ? universityRoads :
    customRoads

  // Auto-select first road on mount
  useEffect(() => {
    if (!selectedSummary && presetRoads.length > 0) {
      handleSelectRoad(presetRoads[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectRoad = async (road: RoadSummary) => {
    setSelectedSummary(road)
    setMobileMenuOpen(false)
    setRoadDetail(null)
    setIsLoadingDetail(true)

    try {
      const res = await fetch(`/api/roads/${road.slug}/components`)
      if (!res.ok) throw new Error('Failed to load road')
      const data: RoadWithProgress = await res.json()
      setRoadDetail(data)
    } catch {
      toast.error('Failed to load road details.')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#0D0D0D]">
      {/* Desktop: Left Panel */}
      <aside className="hidden lg:flex w-72 xl:w-80 flex-col border-r border-[#1F1F1F] bg-[#0A0A0A] fixed left-0 top-0 h-screen">
        <RoadBrowser
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          roads={currentRoads}
          selectedRoad={selectedSummary}
          onSelectRoad={handleSelectRoad}
        />
      </aside>

      {/* Mobile: Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-[#0A0A0A] border-[#1F1F1F]">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-[#0A0A0A] border-[#1F1F1F] p-0">
            <SheetTitle className="sr-only">Road Browser</SheetTitle>
            <SheetDescription className="sr-only">Browse and select learning roads</SheetDescription>
            <RoadBrowser
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              roads={currentRoads}
              selectedRoad={selectedSummary}
              onSelectRoad={handleSelectRoad}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Right Panel */}
      <main className="flex-1 lg:ml-72 xl:ml-80 h-screen overflow-y-auto bg-[#0D0D0D]">
        <AnimatePresence mode="wait">
          {isLoadingDetail ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <Loader2 className="size-6 animate-spin text-[#555]" />
            </motion.div>
          ) : roadDetail ? (
            <RoadView
              key={roadDetail.id}
              road={roadDetail}
              todayMinutes={todayMinutes}
              onMinutesUpdate={(add) => setTodayMinutes(prev => prev + add)}
            />
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

interface RoadBrowserProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  roads: RoadSummary[]
  selectedRoad: RoadSummary | null
  onSelectRoad: (road: RoadSummary) => void
}

function RoadBrowser({ activeTab, setActiveTab, roads, selectedRoad, onSelectRoad }: RoadBrowserProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'presets', label: 'Presets' },
    { id: 'university', label: 'University' },
    { id: 'mine', label: 'Mine' },
  ]

  return (
    <>
      <div className="px-5 py-4 border-b border-[#1F1F1F]">
        <h2 className="text-white font-bold text-sm">Roads</h2>
        <div className="flex gap-4 mt-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'text-[10px] tracking-wider uppercase pb-1 transition-colors',
                activeTab === tab.id
                  ? 'text-[#F97316] border-b-2 border-[#F97316]'
                  : 'text-[#555] hover:text-[#A0A0A0]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {roads.length === 0 ? (
          <p className="text-[#555] text-xs text-center py-8">No roads in this category.</p>
        ) : (
          roads.map((road) => (
            <RoadCard
              key={road.id}
              road={road}
              isSelected={selectedRoad?.id === road.id}
              onSelect={() => onSelectRoad(road)}
            />
          ))
        )}
      </div>

      <div className="px-5 py-4 border-t border-[#1F1F1F]">
        <Link href="/road/build">
          <Button
            variant="outline"
            className="w-full h-9 text-xs font-bold tracking-wide border-[#F97316] text-[#F97316] hover:bg-[#F97316]/10 hover:text-[#F97316]"
          >
            <Plus className="size-4 mr-2" />
            Build a road
          </Button>
        </Link>
      </div>
    </>
  )
}

interface RoadCardProps {
  road: RoadSummary
  isSelected: boolean
  onSelect: () => void
}

function RoadCard({ road, isSelected, onSelect }: RoadCardProps) {
  const Icon = roadIcons[road.icon] ?? Layers
  const totalHours = Math.round((road.total_duration_minutes / 60) * 10) / 10

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full mb-1 px-3 py-3 rounded-sm cursor-pointer transition-colors group text-left flex items-center gap-3',
        isSelected ? 'bg-[#111]' : 'hover:bg-[#111]'
      )}
    >
      <div
        className={cn('self-stretch rounded-l-sm', isSelected ? 'w-1.5' : 'w-1')}
        style={{ backgroundColor: road.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0" style={{ color: road.color }} />
          <span className={cn(
            'text-sm font-medium truncate transition-colors',
            isSelected ? 'text-[#F97316]' : 'text-white group-hover:text-[#F97316]'
          )}>
            {road.title}
          </span>
        </div>
        <p className="text-[#555] text-xs mt-0.5">
          {road.component_count} components · ~{totalHours}h
        </p>
        {road.completion_percent > 0 && (
          <>
            <Progress
              value={road.completion_percent}
              className="mt-2 h-1 bg-[#1F1F1F]"
              style={{ '--progress-color': road.color } as React.CSSProperties}
            />
            <span className="text-[#555] text-[10px]">{road.completion_percent}% complete</span>
          </>
        )}
      </div>
      <ChevronRight className={cn(
        'size-4 shrink-0 transition-opacity text-[#F97316]',
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )} />
    </button>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <h1 className="text-[#333] font-black text-5xl tracking-tight">Select a road</h1>
      <p className="text-[#444] text-sm mt-4 max-w-md">
        Choose from presets, community roads, or build your own.
      </p>
    </motion.div>
  )
}
