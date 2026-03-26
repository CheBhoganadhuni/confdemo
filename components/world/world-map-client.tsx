'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { CityNode } from './city-node'
import { CityView } from './city-view'
import { CityConnections } from './city-connections'
import type { WorldCity, WorldLevel } from '@/lib/data/mock-world'

interface WorldMapClientProps {
  cities: WorldCity[]
  connections: [string, string][]
  levelsByCity: Record<string, WorldLevel[]>
  isAuthenticated: boolean
}

export function WorldMapClient({
  cities,
  connections,
  levelsByCity,
}: WorldMapClientProps) {
  const [view, setView] = useState<'world' | 'city'>('world')
  const [selectedCity, setSelectedCity] = useState<WorldCity | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const offsetStart = useRef({ x: 0, y: 0 })

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCityClick = useCallback((city: WorldCity) => {
    setSelectedCity(city)
    setView('city')
  }, [])

  const handleBackToWorld = useCallback(() => {
    setView('world')
    setSelectedCity(null)
  }, [])

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-city-node]')) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    offsetStart.current = { ...mapOffset }
  }, [mapOffset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setMapOffset({
      x: offsetStart.current.x + dx,
      y: offsetStart.current.y + dy,
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch drag handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-city-node]')) return
    const touch = e.touches[0]
    setIsDragging(true)
    dragStart.current = { x: touch.clientX, y: touch.clientY }
    offsetStart.current = { ...mapOffset }
  }, [mapOffset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const dx = touch.clientX - dragStart.current.x
    const dy = touch.clientY - dragStart.current.y
    setMapOffset({
      x: offsetStart.current.x + dx,
      y: offsetStart.current.y + dy,
    })
  }, [isDragging])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view === 'city') {
        handleBackToWorld()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, handleBackToWorld])

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#0A0A0A' }}>
      {/* Top Bar */}
      <header className="relative z-50 flex h-12 sm:h-14 items-center justify-between border-b border-[#1F1F1F] bg-[#0A0A0A]/80 px-3 sm:px-4 backdrop-blur-md gap-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 text-sm text-[#A0A0A0] transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-white">
          World Map
        </h1>

        {/* Desktop search */}
        <div className="relative hidden sm:block w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#555]" />
          <Input
            type="text"
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-[#1F1F1F] bg-[#111] pl-9 text-sm text-white placeholder:text-[#555] focus:border-[#F97316]/50 focus:ring-[#F97316]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="sm:hidden p-2 text-[#A0A0A0] hover:text-white transition-colors"
        >
          <Search className="size-4" />
        </button>
      </header>

      {/* Mobile search bar (expandable) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden border-b border-[#1F1F1F] overflow-hidden z-40"
          >
            <div className="px-3 py-2 flex items-center gap-2">
              <Search className="size-4 text-[#555] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-8 bg-transparent text-sm text-white placeholder:text-[#555] focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#555]">
                  <X className="size-4" />
                </button>
              )}
              <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="text-[#555] text-xs">
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Canvas */}
      <main className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'world' ? (
            <motion.div
              key="world"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              ref={mapRef}
              className={cn(
                'absolute inset-0 touch-none',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              )}
              style={{ background: '#0D0D0D' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Grid pattern background */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '50px 50px',
                }}
              />

              {/* Topo pattern overlay */}
              <svg
                className="absolute inset-0 size-full opacity-[0.02]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="topo" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="0.5" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="0.5" />
                    <circle cx="100" cy="100" r="40" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#topo)" />
              </svg>

              {/* Map content with pan offset */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <CityConnections
                  cities={cities}
                  connections={connections}
                  highlightCity={searchQuery ? filteredCities.map(c => c.id) : undefined}
                />

                {cities.map((city) => (
                  <CityNode
                    key={city.id}
                    city={city}
                    onClick={() => handleCityClick(city)}
                    isFiltered={searchQuery ? !filteredCities.includes(city) : false}
                  />
                ))}
              </div>

              {/* Empty state for search */}
              {searchQuery && filteredCities.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-lg bg-[#111]/90 px-6 py-4 text-center backdrop-blur">
                    <p className="text-sm text-[#A0A0A0]">No cities found for &quot;{searchQuery}&quot;</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="city"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              {selectedCity && (
                <CityView
                  city={selectedCity}
                  levels={levelsByCity[selectedCity.id] || []}
                  onBack={handleBackToWorld}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
