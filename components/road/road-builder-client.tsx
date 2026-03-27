'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ArrowLeft, Plus, Check, GripVertical, Zap } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { UserAvatarMenu } from '@/components/shared/user-avatar-menu'
import { cn } from '@/lib/utils'
import type { BuilderCity, BuilderComponent } from '@/app/road/build/page'
import { SortableComponentCard } from './sortable-component-card'

interface RoadBuilderClientProps {
  cities: BuilderCity[]
  userRoadCount: number
  maxRoads: number
  hasUsedDailyOp?: boolean
  userName?: string
  tokenCount?: number
  todayMinutes?: number
  editMode?: {
    slug: string
    initialName: string
    initialDescription: string
    initialColor: string
    initialPublished: boolean
    initialComponents: BuilderComponent[]
  }
}

const ROAD_COLORS = ['#F97316', '#4F46E5', '#0D9488', '#DC2626', '#7C3AED', '#059669']

export function RoadBuilderClient({
  cities,
  userRoadCount,
  maxRoads,
  hasUsedDailyOp = false,
  userName,
  tokenCount = 0,
  todayMinutes = 0,
  editMode,
}: RoadBuilderClientProps) {
  const router = useRouter()
  const [roadName, setRoadName] = useState(editMode?.initialName ?? '')
  const [description, setDescription] = useState(editMode?.initialDescription ?? '')
  const [showDescription, setShowDescription] = useState(!!(editMode?.initialDescription))
  const [roadColor, setRoadColor] = useState(editMode?.initialColor ?? ROAD_COLORS[0])
  const [publishToUniversity, setPublishToUniversity] = useState(editMode?.initialPublished ?? false)
  const [selectedComponents, setSelectedComponents] = useState<BuilderComponent[]>(editMode?.initialComponents ?? [])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)

  // Ref to focus desktop search when center "+" is clicked
  const searchInputRef = useRef<HTMLInputElement>(null)

  const atLimit = userRoadCount >= maxRoads

  const filteredCities = useMemo(() => {
    return cities.map(city => ({
      ...city,
      components: city.components.filter(comp => {
        const matchesSearch = comp.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = !activeFilter || city.id === activeFilter
        return matchesSearch && matchesFilter
      }),
    })).filter(city => city.components.length > 0 || !searchQuery)
  }, [cities, searchQuery, activeFilter])

  const selectedIds = useMemo(() => new Set(selectedComponents.map(c => c.id)), [selectedComponents])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const addComponent = (component: BuilderComponent) => {
    if (selectedIds.has(component.id)) return
    setSelectedComponents(prev => [...prev, component])
  }

  const addAllFromCity = (cityId: string) => {
    const city = cities.find(c => c.id === cityId)
    if (!city) return
    setSelectedComponents(prev => [...prev, ...city.components.filter(c => !selectedIds.has(c.id))])
  }

  const removeComponent = (componentId: string) => {
    setSelectedComponents(prev => prev.filter(c => c.id !== componentId))
  }

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (over && active.id !== over.id) {
      setSelectedComponents(items => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Open component browser (desktop: focus search; mobile: open sheet)
  const openComponentBrowser = () => {
    if (window.innerWidth >= 1024) {
      searchInputRef.current?.focus()
    } else {
      setMobileSheetOpen(true)
    }
  }

  const totalMinutes = selectedComponents.reduce((sum, c) => sum + c.estimatedMinutes, 0)
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10

  const handleSave = async () => {
    if (!roadName.trim() || selectedComponents.length === 0 || hasUsedDailyOp) return
    if (!editMode && atLimit) return
    setIsSaving(true)
    try {
      const isEdit = !!editMode
      const url = isEdit ? `/api/roads/update/${editMode.slug}` : '/api/roads/create'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: roadName.trim(),
          description: description.trim() || undefined,
          color: roadColor,
          component_ids: selectedComponents.map(c => c.id),
          is_published: publishToUniversity,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'road_limit') {
          toast.error('You have 3 roads. Delete one to create more.')
        } else if (data.error === 'daily_op_limit') {
          toast.error('One road operation per day. Come back tomorrow.')
        } else {
          toast.error(data.message ?? 'Failed to save road.')
        }
        return
      }
      toast.success(isEdit ? 'Road updated!' : 'Road saved!')
      setSaveSuccess(true)
      setTimeout(() => router.push('/road'), 500)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const activeComponent = activeId ? selectedComponents.find(c => c.id === activeId) : null

  const componentBrowser = (
    <>
      <div className="px-4 pt-4 pb-3 sticky top-0 bg-[#0A0A0A] border-b border-[#1A1A1A] z-10">
        <Input
          ref={searchInputRef}
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#111] border-[#1F1F1F] rounded-sm h-9 text-sm text-white placeholder:text-[#555]"
        />
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveFilter(null)}
            className={cn(
              'px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors',
              !activeFilter ? 'border-[#F97316] text-[#F97316]' : 'bg-[#111] border-[#1F1F1F] text-[#A0A0A0] hover:border-[#333]'
            )}
          >All</button>
          {cities.map(city => (
            <button
              key={city.id}
              onClick={() => setActiveFilter(city.id === activeFilter ? null : city.id)}
              className={cn(
                'px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors',
                city.id === activeFilter ? 'border-[#F97316] text-[#F97316]' : 'bg-[#111] border-[#1F1F1F] text-[#A0A0A0] hover:border-[#333]'
              )}
            >{city.name}</button>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={filteredCities.map(c => c.id)} className="space-y-1">
          {filteredCities.map(city => (
            <AccordionItem key={city.id} value={city.id} className="border-none">
              <AccordionTrigger className="py-2 px-2 hover:no-underline hover:bg-[#111] rounded-sm [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs" style={{ color: city.color }}>{city.icon}</span>
                  <span className="text-white text-sm font-medium">{city.name}</span>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); addAllFromCity(city.id) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); addAllFromCity(city.id) } }}
                  className="text-[#F97316] text-xs hover:underline mr-2 cursor-pointer"
                >Add all</span>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="space-y-1">
                  {city.components.map(comp => {
                    const isSelected = selectedIds.has(comp.id)
                    return (
                      <button
                        key={comp.id}
                        onClick={() => { if (!isSelected) addComponent(comp) }}
                        disabled={isSelected}
                        className={cn(
                          'w-full mx-2 px-3 py-2.5 rounded-sm flex items-center gap-2 transition-colors group text-left',
                          isSelected ? 'opacity-50 cursor-default' : 'hover:bg-[#111] cursor-pointer'
                        )}
                      >
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ color: roadColor }}>
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 border border-[#333] rounded-sm flex items-center justify-center text-[#555] group-hover:border-[#F97316] group-hover:text-[#F97316] transition-colors">
                            <Plus className="w-3 h-3" />
                          </div>
                        )}
                        <span className={cn('text-xs flex-1 transition-colors', isSelected ? 'text-[#555]' : 'text-[#A0A0A0] group-hover:text-white')}>
                          {comp.name}
                        </span>
                        <span className="text-[#555] text-[10px]">{comp.estimatedMinutes}m</span>
                      </button>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </>
  )

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-[#0A0A0A]">

        {/* ── Header ── */}
        <header className="h-14 border-b border-[#1F1F1F] px-4 sm:px-6 flex items-center justify-between shrink-0 gap-2">
          <Link
            href="/road"
            className="text-[#555] hover:text-white text-sm flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Roads</span>
          </Link>
          <span className="text-white font-bold text-sm">{editMode ? 'Edit Road' : 'Build Your Road'}</span>
          <div className="flex items-center gap-3">
            {/* Mobile component browser toggle */}
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <button
                onClick={() => setMobileSheetOpen(true)}
                className="lg:hidden flex items-center justify-center size-8 rounded-sm border border-[#1F1F1F] text-[#A0A0A0] hover:text-white hover:border-[#333] transition-colors"
              >
                <Plus className="size-4" />
              </button>
              <SheetContent side="left" className="w-[85vw] max-w-sm bg-[#0A0A0A] border-[#1F1F1F] p-0 flex flex-col">
                <SheetTitle className="sr-only">Component Browser</SheetTitle>
                <SheetDescription className="sr-only">Browse and add components to your road</SheetDescription>
                {componentBrowser}
              </SheetContent>
            </Sheet>
            <UserAvatarMenu userName={userName} tokenCount={tokenCount} todayMinutes={todayMinutes} activeRoute="/road" />
          </div>
        </header>

        {/* Daily op banner */}
        <AnimatePresence>
          {hasUsedDailyOp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden shrink-0"
            >
              <div className="flex items-center gap-2.5 bg-[#1A1A1A] border-b border-[#F97316]/25 px-4 sm:px-6 py-2.5">
                <Zap className="size-3.5 text-[#F97316] shrink-0" />
                <p className="text-[#A0A0A0] text-xs">
                  You&apos;ve used your road operation for today. Come back tomorrow to save changes.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop left panel */}
          <aside className="hidden lg:flex w-80 border-r border-[#1F1F1F] h-full flex-col overflow-y-auto bg-[#0A0A0A]">
            {componentBrowser}
          </aside>

          {/* Road canvas */}
          <main className="flex-1 h-full overflow-y-auto bg-[#0D0D0D] flex flex-col">
            {/* Road metadata */}
            <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-4 border-b border-[#1F1F1F] shrink-0">
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="Name your road..."
                className="text-white font-black text-xl sm:text-2xl tracking-tight bg-transparent border-none outline-none w-full placeholder:text-[#333]"
              />

              {/* Description toggle / textarea */}
              <div className="mt-2">
                {!showDescription ? (
                  <button
                    onClick={() => setShowDescription(true)}
                    className="text-[#555] text-xs hover:text-[#A0A0A0] transition-colors cursor-pointer"
                  >
                    + Add description (optional)
                  </button>
                ) : (
                  <div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                      placeholder="What is this road about? (optional)"
                      rows={2}
                      className="w-full bg-transparent border-b border-[#1F1F1F] focus:border-[#333] text-[#A0A0A0] text-sm py-2 outline-none resize-none placeholder:text-[#333]"
                    />
                    <div className="text-[#444] text-[10px] text-right">{description.length}/200</div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2 sm:gap-3 items-center flex-wrap">
                <div className="flex gap-1.5">
                  {ROAD_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setRoadColor(color)}
                      className={cn(
                        'w-5 h-5 rounded-full transition-all',
                        roadColor === color && 'ring-2 ring-white ring-offset-1 ring-offset-[#0D0D0D]'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-[#555] text-xs">{selectedComponents.length} components</span>
                <span className="text-[#555] text-xs">~{totalHours}h</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={publishToUniversity}
                    onCheckedChange={setPublishToUniversity}
                    className="data-[state=checked]:bg-[#F97316]"
                  />
                  <span className="text-[#555] text-xs hidden sm:inline">Publish to University</span>
                  <span className="text-[#555] text-xs sm:hidden">Publish</span>
                </div>
              </div>
            </div>

            {/* Component sequence */}
            <div className="flex-1 px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto">
              {selectedComponents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <button
                    onClick={openComponentBrowser}
                    className="w-20 h-20 sm:w-[120px] sm:h-[120px] rounded-full border-2 border-dashed border-[#1F1F1F] hover:border-[#333] flex items-center justify-center transition-colors group cursor-pointer"
                  >
                    <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-[#333] group-hover:text-[#555] transition-colors" />
                  </button>
                  <p className="text-[#333] text-sm mt-4 pointer-events-none select-none">
                    <span className="lg:hidden">Tap + to browse components</span>
                    <span className="hidden lg:inline">Add components from the left panel</span>
                  </p>
                  <p className="text-[#444] text-xs mt-1 pointer-events-none select-none">Your road will appear here as a sequence</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={selectedComponents.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {selectedComponents.map((comp, index) => (
                          <SortableComponentCard
                            key={comp.id}
                            component={comp}
                            index={index}
                            roadColor={roadColor}
                            onRemove={() => removeComponent(comp.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeComponent ? (
                      <div className="bg-[#111] border border-[#333] rounded-sm px-4 py-3 flex items-center gap-3 opacity-90 shadow-lg">
                        <GripVertical className="w-4 h-4 text-[#333]" />
                        <span className="text-white text-sm font-medium">{activeComponent.name}</span>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>

            {/* Bottom bar */}
            <div className="sticky bottom-0 bg-[#0A0A0A] border-t border-[#1F1F1F] px-4 sm:px-8 py-3 sm:py-4 flex gap-3 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button
                      onClick={handleSave}
                      disabled={hasUsedDailyOp || isSaving || saveSuccess || !roadName.trim() || selectedComponents.length === 0 || (!editMode && atLimit)}
                      title={hasUsedDailyOp ? 'One road operation per day' : undefined}
                      className={cn(
                        'w-full h-10 rounded-sm font-bold transition-all',
                        saveSuccess
                          ? 'bg-emerald-500 hover:bg-emerald-500'
                          : hasUsedDailyOp || (!editMode && atLimit)
                          ? 'bg-[#1A1A1A] text-[#444] cursor-not-allowed'
                          : 'bg-[#F97316] hover:bg-[#EA6B0A] text-black'
                      )}
                    >
                      {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : editMode ? 'Save Changes' : 'Save Road'}
                    </Button>
                  </div>
                </TooltipTrigger>
                {((!editMode && atLimit) || hasUsedDailyOp) && (
                  <TooltipContent>
                    <p>{hasUsedDailyOp ? 'One road operation per day' : 'Road limit reached'}</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <Button
                variant="outline"
                onClick={() => router.push('/road')}
                className="border-[#1F1F1F] text-[#555] h-10 px-4 sm:px-6 rounded-sm hover:border-[#333] hover:text-white"
              >
                Discard
              </Button>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
