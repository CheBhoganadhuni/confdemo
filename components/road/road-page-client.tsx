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
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { RoadView } from './road-view'
import { type Road, type UserDailyProgress, getComponentsForRoad } from '@/lib/data/mock-roads'

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

interface RoadPageClientProps {
  presetRoads: Road[]
  universityRoads: Road[]
  customRoads: Road[]
  dailyProgress: UserDailyProgress
}

type TabType = 'presets' | 'university' | 'mine'

export function RoadPageClient({ 
  presetRoads, 
  universityRoads, 
  customRoads,
  dailyProgress 
}: RoadPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('presets')
  const [selectedRoad, setSelectedRoad] = useState<Road | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get roads for current tab
  const currentRoads = activeTab === 'presets' 
    ? presetRoads 
    : activeTab === 'university' 
      ? universityRoads 
      : customRoads

  // Auto-select first road on mount
  useEffect(() => {
    if (!selectedRoad && presetRoads.length > 0) {
      setSelectedRoad(presetRoads[0])
    }
  }, [presetRoads, selectedRoad])

  const handleSelectRoad = (road: Road) => {
    setSelectedRoad(road)
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex h-screen bg-[#0D0D0D]">
      {/* Desktop: Left Panel - Road Browser */}
      <aside className="hidden lg:flex w-72 xl:w-80 flex-col border-r border-[#1F1F1F] bg-[#0A0A0A] fixed left-0 top-0 h-screen">
        <RoadBrowser
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          roads={currentRoads}
          selectedRoad={selectedRoad}
          onSelectRoad={handleSelectRoad}
        />
      </aside>

      {/* Mobile: Hamburger menu */}
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
              selectedRoad={selectedRoad}
              onSelectRoad={handleSelectRoad}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Right Panel - Active Road View */}
      <main className="flex-1 lg:ml-72 xl:ml-80 h-screen overflow-y-auto bg-[#0D0D0D]">
        <AnimatePresence mode="wait">
          {selectedRoad ? (
            <RoadView 
              key={selectedRoad.id}
              road={selectedRoad} 
              dailyProgress={dailyProgress}
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
  roads: Road[]
  selectedRoad: Road | null
  onSelectRoad: (road: Road) => void
}

function RoadBrowser({ activeTab, setActiveTab, roads, selectedRoad, onSelectRoad }: RoadBrowserProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'presets', label: 'Presets' },
    { id: 'university', label: 'University' },
    { id: 'mine', label: 'Mine' },
  ]

  return (
    <>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1F1F1F]">
        <h2 className="text-white font-bold text-sm">Roads</h2>
        
        {/* Tabs */}
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

      {/* Road list */}
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

      {/* Build a road button */}
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
  road: Road
  isSelected: boolean
  onSelect: () => void
}

function RoadCard({ road, isSelected, onSelect }: RoadCardProps) {
  const Icon = roadIcons[road.icon] || Layers

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full mb-1 px-3 py-3 rounded-sm cursor-pointer transition-colors group text-left flex items-center gap-3',
        isSelected 
          ? 'bg-[#111]' 
          : 'hover:bg-[#111]'
      )}
    >
      {/* Left color bar */}
      <div 
        className={cn(
          'w-1 self-stretch rounded-l-sm',
          isSelected ? 'w-1.5' : 'w-1'
        )}
        style={{ backgroundColor: road.color }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0" style={{ color: road.color }} />
          <span className={cn(
            'text-sm font-medium truncate transition-colors',
            isSelected ? 'text-[#F97316]' : 'text-white group-hover:text-[#F97316]'
          )}>
            {road.name}
          </span>
        </div>
        <p className="text-[#555] text-xs mt-0.5">
          {road.componentCount} components · ~{road.totalHours}h
        </p>
        
        {/* Progress bar if user has progress */}
        {road.completionPercent > 0 && (
          <>
            <Progress 
              value={road.completionPercent} 
              className="mt-2 h-1 bg-[#1F1F1F]"
              style={{ '--progress-color': road.color } as React.CSSProperties}
            />
            <span className="text-[#555] text-[10px]">
              {road.completionPercent}% complete
            </span>
          </>
        )}
      </div>

      {/* Chevron on hover */}
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
      <h1 className="text-[#333] font-black text-5xl tracking-tight">
        Select a road
      </h1>
      <p className="text-[#444] text-sm mt-4 max-w-md">
        Choose from presets, community roads, or build your own.
      </p>
    </motion.div>
  )
}
