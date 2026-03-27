'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ChevronRight,
  Plus,
  X,
  Search,
  Layers,
  Database,
  Cpu,
  Brain,
  GraduationCap,
  Globe,
  Target,
  Loader2,
  Menu,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { UserAvatarMenu } from '@/components/shared/user-avatar-menu'
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
  Layers, Database, Cpu, Brain, GraduationCap, Globe, Target,
}

interface RoadPageClientProps {
  presetRoads: RoadSummary[]
  universityRoads: RoadSummary[]
  customRoads: RoadSummary[]
  todayMinutes: number
  userName?: string
  tokenCount?: number
}

type TabType = 'presets' | 'university' | 'mine'

export function RoadPageClient({
  presetRoads,
  universityRoads,
  customRoads,
  todayMinutes: initialTodayMinutes,
  userName,
  tokenCount = 0,
}: RoadPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('presets')
  const [selectedSummary, setSelectedSummary] = useState<RoadSummary | null>(null)
  const [roadDetail, setRoadDetail] = useState<RoadWithProgress | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [todayMinutes, setTodayMinutes] = useState(initialTodayMinutes)
  const [myRoads, setMyRoads] = useState<RoadSummary[]>(customRoads)

  const currentRoads =
    activeTab === 'presets' ? presetRoads :
    activeTab === 'university' ? universityRoads :
    myRoads

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

  const browserContent = (
    <RoadBrowser
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      roads={currentRoads}
      allRoads={{ presets: presetRoads, university: universityRoads, mine: myRoads }}
      selectedRoad={selectedSummary}
      onSelectRoad={handleSelectRoad}
    />
  )

  return (
    <div className="h-screen flex flex-col bg-[#0D0D0D] overflow-hidden">

      {/* ── Top header ── */}
      <header className="h-14 shrink-0 grid grid-cols-3 items-center border-b border-[#1F1F1F] bg-[#0A0A0A] px-4 sm:px-5 z-40">
        {/* Left: hamburger (mobile only) */}
        <div className="flex items-center">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-[#A0A0A0] hover:text-white transition-colors"
            aria-label="Open road browser"
          >
            <Menu className="size-5" />
          </button>
        </div>

        {/* Centre: title */}
        <span className="text-white font-bold text-sm tracking-tight text-center">Roads</span>

        {/* Right: avatar menu */}
        <div className="flex items-center justify-end">
          <UserAvatarMenu
            userName={userName}
            tokenCount={tokenCount}
            todayMinutes={todayMinutes}
            activeRoute="/road"
          />
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-72 xl:w-80 flex-col border-r border-[#1F1F1F] bg-[#0A0A0A] shrink-0 overflow-y-auto">
          {browserContent}
        </aside>

        {/* Mobile sidebar sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-72 bg-[#0A0A0A] border-[#1F1F1F] p-0 [&>button:last-child]:hidden">
            <SheetTitle className="sr-only">Road Browser</SheetTitle>
            <SheetDescription className="sr-only">Browse and select learning roads</SheetDescription>
            {browserContent}
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#0D0D0D]">
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
                isOwner={myRoads.some(r => r.id === selectedSummary?.id)}
                onDeleted={() => {
                  setMyRoads(prev => prev.filter(r => r.id !== selectedSummary?.id))
                  setSelectedSummary(null)
                  setRoadDetail(null)
                }}
              />
            ) : (
              <EmptyState />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

interface RoadBrowserProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  roads: RoadSummary[]
  allRoads: { presets: RoadSummary[]; university: RoadSummary[]; mine: RoadSummary[] }
  selectedRoad: RoadSummary | null
  onSelectRoad: (road: RoadSummary) => void
}

function RoadBrowser({ activeTab, setActiveTab, roads, allRoads, selectedRoad, onSelectRoad }: RoadBrowserProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const tabs: { id: TabType; label: string }[] = [
    { id: 'presets',    label: 'Presets'    },
    { id: 'university', label: 'University' },
    { id: 'mine',       label: 'Mine'       },
  ]

  // When searching, gather matches from all sections with labels
  const searchSections: { label: string; roads: RoadSummary[] }[] = q
    ? [
        { label: 'Presets',    roads: allRoads.presets.filter(r => r.title.toLowerCase().includes(q)) },
        { label: 'University', roads: allRoads.university.filter(r => r.title.toLowerCase().includes(q)) },
        { label: 'Mine',       roads: allRoads.mine.filter(r => r.title.toLowerCase().includes(q)) },
      ].filter(s => s.roads.length > 0)
    : []

  const totalMatches = searchSections.reduce((n, s) => n + s.roads.length, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Tabs + search */}
      <div className="px-4 pt-3 pb-0 border-b border-[#1F1F1F] shrink-0">
        {/* Search input */}
        <div className="flex items-center gap-2 bg-[#111] border border-[#1F1F1F] rounded-sm px-2.5 mb-3 focus-within:border-[#333] transition-colors">
          <Search className="size-3.5 text-[#444] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search roads…"
            className="flex-1 bg-transparent py-1.5 text-xs text-white placeholder:text-[#444] outline-none min-w-0"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#444] hover:text-[#888] shrink-0 transition-colors">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Tabs — hidden while searching */}
        {!q && (
          <div className="flex gap-4 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'text-[10px] tracking-wider uppercase pb-2.5 transition-colors',
                  activeTab === tab.id
                    ? 'text-[#F97316] border-b-2 border-[#F97316]'
                    : 'text-[#555] hover:text-[#A0A0A0]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {q ? (
          // Search results across all sections
          totalMatches === 0 ? (
            <p className="text-[#555] text-xs text-center py-8">No roads match &ldquo;{query}&rdquo;</p>
          ) : (
            searchSections.map(section => (
              <div key={section.label}>
                <p className="text-[10px] tracking-widest uppercase text-[#333] px-2 pt-3 pb-1">{section.label}</p>
                {section.roads.map(road => (
                  <RoadCard
                    key={road.id}
                    road={road}
                    isSelected={selectedRoad?.id === road.id}
                    onSelect={() => onSelectRoad(road)}
                  />
                ))}
              </div>
            ))
          )
        ) : (
          // Normal tab view
          roads.length === 0 ? (
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
          )
        )}
      </div>

      <div className="px-5 py-4 border-t border-[#1F1F1F] shrink-0">
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
    </div>
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

// keep X in scope to avoid lint warnings (used in other variants)
void X

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
