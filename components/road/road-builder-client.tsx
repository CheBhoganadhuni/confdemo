'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { ArrowLeft, Plus, Check, GripVertical, X } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { BuilderCity, BuilderComponent } from '@/app/road/build/page'
import { SortableComponentCard } from './sortable-component-card'

interface RoadBuilderClientProps {
  cities: BuilderCity[]
  userRoadCount: number
  maxRoads: number
}

const ROAD_COLORS = [
  '#F97316', // orange
  '#4F46E5', // indigo
  '#0D9488', // teal
  '#DC2626', // red
  '#7C3AED', // violet
  '#059669', // emerald
]

export function RoadBuilderClient({ cities, userRoadCount, maxRoads }: RoadBuilderClientProps) {
  const router = useRouter()
  const [roadName, setRoadName] = useState('')
  const [roadColor, setRoadColor] = useState(ROAD_COLORS[0])
  const [publishToUniversity, setPublishToUniversity] = useState(false)
  const [selectedComponents, setSelectedComponents] = useState<BuilderComponent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const atLimit = userRoadCount >= maxRoads

  // Filter cities and components based on search and filter
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

  // Get IDs of components already in road
  const selectedIds = useMemo(() => new Set(selectedComponents.map(c => c.id)), [selectedComponents])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Add component to road
  const addComponent = (component: BuilderComponent) => {
    if (selectedIds.has(component.id)) return
    setSelectedComponents(prev => [...prev, component])
  }

  // Add all components from a city
  const addAllFromCity = (cityId: string) => {
    const city = cities.find(c => c.id === cityId)
    if (!city) return
    const newComponents = city.components.filter(c => !selectedIds.has(c.id))
    setSelectedComponents(prev => [...prev, ...newComponents])
  }

  // Remove component from road
  const removeComponent = (componentId: string) => {
    setSelectedComponents(prev => prev.filter(c => c.id !== componentId))
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handle drag end
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

  // Calculate totals
  const totalMinutes = selectedComponents.reduce((sum, c) => sum + c.estimatedMinutes, 0)
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10

  // Save road
  const handleSave = async () => {
    if (!roadName.trim() || selectedComponents.length === 0 || atLimit) return
    
    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSaveSuccess(true)
    setTimeout(() => {
      router.push('/road')
    }, 500)
  }

  // Get the active component for drag overlay
  const activeComponent = activeId ? selectedComponents.find(c => c.id === activeId) : null

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-[#0A0A0A]">
        {/* Top Bar */}
        <header className="h-14 border-b border-[#1F1F1F] px-6 flex items-center justify-between shrink-0">
          <Link 
            href="/road" 
            className="text-[#555] hover:text-white text-sm flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Roads
          </Link>
          <span className="text-white font-bold text-sm">Build Your Road</span>
          <span className={cn(
            "text-xs",
            atLimit ? "text-[#F97316]" : "text-[#555]"
          )}>
            {atLimit 
              ? "Road limit reached — delete one to continue" 
              : `${userRoadCount} / ${maxRoads} roads used`
            }
          </span>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Component Browser */}
          <aside className="w-80 border-r border-[#1F1F1F] h-full overflow-y-auto bg-[#0A0A0A]">
            {/* Search */}
            <div className="px-4 pt-4 pb-3 sticky top-0 bg-[#0A0A0A] border-b border-[#1A1A1A] z-10">
              <Input
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111] border-[#1F1F1F] rounded-sm h-9 text-sm text-white placeholder:text-[#555]"
              />
              {/* Filter chips */}
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors",
                    !activeFilter
                      ? "border-[#F97316] text-[#F97316]"
                      : "bg-[#111] border-[#1F1F1F] text-[#A0A0A0] hover:border-[#333]"
                  )}
                >
                  All
                </button>
                {cities.map(city => (
                  <button
                    key={city.id}
                    onClick={() => setActiveFilter(city.id === activeFilter ? null : city.id)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors",
                      city.id === activeFilter
                        ? "border-[#F97316] text-[#F97316]"
                        : "bg-[#111] border-[#1F1F1F] text-[#A0A0A0] hover:border-[#333]"
                    )}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            {/* City accordions */}
            <div className="px-3 py-2">
              <Accordion 
                type="multiple" 
                defaultValue={filteredCities.map(c => c.id)}
                className="space-y-1"
              >
                {filteredCities.map(city => (
                  <AccordionItem 
                    key={city.id} 
                    value={city.id}
                    className="border-none"
                  >
                    <AccordionTrigger className="py-2 px-2 hover:no-underline hover:bg-[#111] rounded-sm [&[data-state=open]>svg]:rotate-180">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs" style={{ color: city.color }}>{city.icon}</span>
                        <span className="text-white text-sm font-medium">{city.name}</span>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          addAllFromCity(city.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            e.preventDefault()
                            addAllFromCity(city.id)
                          }
                        }}
                        className="text-[#F97316] text-xs hover:underline mr-2 cursor-pointer"
                      >
                        Add all
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="space-y-1">
                        {city.components.map(comp => {
                          const isSelected = selectedIds.has(comp.id)
                          return (
                            <button
                              key={comp.id}
                              onClick={() => !isSelected && addComponent(comp)}
                              disabled={isSelected}
                              className={cn(
                                "w-full mx-2 px-3 py-2.5 rounded-sm flex items-center gap-2 transition-colors group text-left",
                                isSelected 
                                  ? "opacity-50 cursor-default" 
                                  : "hover:bg-[#111] cursor-pointer"
                              )}
                            >
                              {isSelected ? (
                                <div 
                                  className="w-4 h-4 rounded-sm flex items-center justify-center"
                                  style={{ color: roadColor }}
                                >
                                  <Check className="w-3 h-3" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 border border-[#333] rounded-sm flex items-center justify-center text-[#555] group-hover:border-[#F97316] group-hover:text-[#F97316] transition-colors">
                                  <Plus className="w-3 h-3" />
                                </div>
                              )}
                              <span className={cn(
                                "text-xs flex-1 transition-colors",
                                isSelected ? "text-[#555]" : "text-[#A0A0A0] group-hover:text-white"
                              )}>
                                {comp.name}
                              </span>
                              <span className="text-[#555] text-[10px]">
                                {comp.estimatedMinutes}m
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </aside>

          {/* Right Panel - Road Canvas */}
          <main className="flex-1 h-full overflow-y-auto bg-[#0D0D0D] flex flex-col">
            {/* Road metadata */}
            <div className="px-8 pt-6 pb-4 border-b border-[#1F1F1F] shrink-0">
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="Name your road..."
                className="text-white font-black text-2xl tracking-tight bg-transparent border-none outline-none w-full placeholder:text-[#333]"
              />
              <div className="mt-3 flex gap-3 items-center flex-wrap">
                {/* Color picker */}
                <div className="flex gap-1.5">
                  {ROAD_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setRoadColor(color)}
                      className={cn(
                        "w-5 h-5 rounded-full transition-all",
                        roadColor === color && "ring-2 ring-white ring-offset-1 ring-offset-[#0D0D0D]"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-[#555] text-xs">
                  {selectedComponents.length} components
                </span>
                <span className="text-[#555] text-xs">
                  ~{totalHours} hours total
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={publishToUniversity}
                    onCheckedChange={setPublishToUniversity}
                    className="data-[state=checked]:bg-[#F97316]"
                  />
                  <span className="text-[#555] text-xs">Publish to University</span>
                </div>
              </div>
            </div>

            {/* Component sequence */}
            <div className="flex-1 px-8 py-6 overflow-y-auto">
              {selectedComponents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-[120px] h-[120px] rounded-full border-2 border-dashed border-[#1F1F1F] flex items-center justify-center">
                    <Plus className="w-10 h-10 text-[#333]" />
                  </div>
                  <p className="text-[#333] text-sm mt-4">Add components from the left panel</p>
                  <p className="text-[#444] text-xs mt-1">Your road will appear here as a sequence</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedComponents.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
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
            <div className="sticky bottom-0 bg-[#0A0A0A] border-t border-[#1F1F1F] px-8 py-4 flex gap-3 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button
                      onClick={handleSave}
                      disabled={!roadName.trim() || selectedComponents.length === 0 || atLimit || isSaving}
                      className={cn(
                        "w-full h-10 rounded-sm font-bold transition-all",
                        saveSuccess 
                          ? "bg-emerald-500 hover:bg-emerald-500" 
                          : "bg-[#F97316] hover:bg-[#EA6B0A] text-black"
                      )}
                    >
                      {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Road'}
                    </Button>
                  </div>
                </TooltipTrigger>
                {atLimit && (
                  <TooltipContent>
                    <p>Daily limit reached</p>
                  </TooltipContent>
                )}
              </Tooltip>
              <Button
                variant="outline"
                onClick={() => router.push('/road')}
                className="border-[#1F1F1F] text-[#555] h-10 px-6 rounded-sm hover:border-[#333] hover:text-white"
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
