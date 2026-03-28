'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, User, ChevronDown,
  Home, Map, GitBranch, LogOut, Zap, Clock, Route,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { CityNode } from './city-node'
import { CityView } from './city-view'
import { CityConnections } from './city-connections'
import { CityCard } from './city-card'
import type { CityWithProgress } from '@/lib/types/database'
import { useBackButtonClose } from '@/hooks/use-back-button-close'
import { useSignOut } from '@/hooks/use-sign-out'
import { PageLoader } from '@/components/ui/page-loader'

export type WorldCityMapped = CityWithProgress & {
  position: { left: string; top: string }
  size: 'small' | 'normal' | 'large'
}

const CITY_LAYOUT: Record<string, { position: { left: string; top: string }; size: 'small' | 'normal' | 'large' }> = {
  'beginners-picnic':   { position: { left: '12%', top: '65%' }, size: 'normal' },
  'blueprint-factory':  { position: { left: '22%', top: '30%' }, size: 'normal' },
  'algorithmic-jungle': { position: { left: '40%', top: '20%' }, size: 'large'  },
  'control-tower':      { position: { left: '60%', top: '15%' }, size: 'normal' },
  'signal-city':        { position: { left: '75%', top: '35%' }, size: 'normal' },
  'data-vault':         { position: { left: '55%', top: '55%' }, size: 'large'  },
  'engine-room':        { position: { left: '30%', top: '60%' }, size: 'small'  },
  'api-district':       { position: { left: '48%', top: '72%' }, size: 'normal' },
  'cloud-deck':         { position: { left: '68%', top: '68%' }, size: 'normal' },
  'git-garage':         { position: { left: '83%', top: '55%' }, size: 'small'  },
}

const DEFAULT_POSITION = { left: '50%', top: '50%' }
const DEFAULT_SIZE = 'normal' as const

const CITY_CONNECTIONS: [string, string][] = [
  ['beginners-picnic', 'engine-room'],
  ['beginners-picnic', 'blueprint-factory'],
  ['blueprint-factory', 'algorithmic-jungle'],
  ['algorithmic-jungle', 'control-tower'],
  ['control-tower', 'signal-city'],
  ['algorithmic-jungle', 'data-vault'],
  ['engine-room', 'api-district'],
  ['data-vault', 'api-district'],
  ['data-vault', 'cloud-deck'],
  ['signal-city', 'git-garage'],
  ['cloud-deck', 'git-garage'],
]

const MAP_DECORATIONS = [
  { type: '+', left: '8%',  top: '20%' },
  { type: '◇', left: '90%', top: '25%' },
  { type: '+', left: '18%', top: '82%' },
  { type: '◇', left: '85%', top: '82%' },
  { type: '+', left: '52%', top: '88%' },
  { type: '◇', left: '5%',  top: '45%' },
  { type: '+', left: '95%', top: '55%' },
]

interface WorldMapClientProps {
  cities: CityWithProgress[]
  userId: string
  universityId?: string
  userName?: string
  tokenCount?: number
  todayMinutes?: number
}

export function WorldMapClient({ cities, userName, tokenCount = 0, todayMinutes = 0 }: WorldMapClientProps) {
  const mappedCities: WorldCityMapped[] = cities.map(city => ({
    ...city,
    position: CITY_LAYOUT[city.slug]?.position ?? DEFAULT_POSITION,
    size: CITY_LAYOUT[city.slug]?.size ?? DEFAULT_SIZE,
  }))

  const [view, setView] = useState<'world' | 'city'>('world')
  const [selectedCity, setSelectedCity] = useState<WorldCityMapped | null>(null)
  const [cityCard, setCityCard] = useState<WorldCityMapped | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 })

  const [isDragging, setIsDragging] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const offsetStart = useRef({ x: 0, y: 0 })
  const avatarRef = useRef<HTMLDivElement>(null)

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const filteredCities = mappedCities.filter(city =>
    city.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ALL city clicks → open CityCard first (desktop: centered, mobile: bottom sheet)
  const handleCityClick = useCallback((city: WorldCityMapped) => {
    setCityCard(city)
  }, [])

  const handleExploreCity = useCallback((city: WorldCityMapped) => {
    setSelectedCity(city)
    setView('city')
    setSearchQuery('')
    setCityCard(null)
  }, [])

  const handleBackToWorld = useCallback(() => {
    setView('world')
    setSelectedCity(null)
  }, [])

  // Single back-button hook for the whole world route.
  // Priority: city view > city card > search.
  // When a layer transitions to the next (e.g. cityCard → cityView) isOpen stays
  // true so no push/pop races happen — only the onClose ref updates.
  const worldBackAction =
    view === 'city'       ? handleBackToWorld :
    cityCard !== null     ? () => setCityCard(null) :
    searchOpen            ? () => { setSearchOpen(false); setSearchQuery('') } :
    null
  useBackButtonClose(worldBackAction !== null, () => worldBackAction?.())

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-city-node]')) return
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    offsetStart.current = { ...mapOffset }
  }, [mapOffset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setMapOffset({
      x: offsetStart.current.x + (e.clientX - dragStart.current.x),
      y: offsetStart.current.y + (e.clientY - dragStart.current.y),
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

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
    setMapOffset({
      x: offsetStart.current.x + (touch.clientX - dragStart.current.x),
      y: offsetStart.current.y + (touch.clientY - dragStart.current.y),
    })
  }, [isDragging])

  const handleTouchEnd = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (avatarOpen) { setAvatarOpen(false); return }
        if (cityCard) { setCityCard(null); return }
        if (view === 'city') handleBackToWorld()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, avatarOpen, cityCard, handleBackToWorld])

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    if (avatarOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [avatarOpen])

  const { signOut, signingOut } = useSignOut()
  const handleSignOut = () => {
    setAvatarOpen(false)
    signOut()
  }

  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : null

  const NAV_ITEMS = [
    { icon: Home,      label: 'Home',      href: '/',        active: false },
    { icon: Map,       label: 'World Map', href: '/world',   active: true  },
    { icon: Route,     label: 'Roads',     href: '/road',    active: false },
    { icon: User,      label: 'Profile',   href: '/profile', active: false },
  ]

  return (
    <>
    {signingOut && <PageLoader />}
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0A0A0A]">

      {/* ── Top bar ── */}
      <header className="relative z-50 flex h-12 sm:h-14 items-center justify-between border-b border-[#1F1F1F] bg-[#0A0A0A]/90 px-3 sm:px-4 backdrop-blur-md gap-2">

        {/* Left — only show Home link in world view; nothing in city view */}
        <div className="w-16 shrink-0">
          {view === 'world' && (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-[#A0A0A0] hover:text-white transition-colors"
            >
              <Home className="size-4" />
              <span className="hidden sm:inline text-xs">Home</span>
            </Link>
          )}
        </div>

        {/* Center title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-white pointer-events-none whitespace-nowrap">
          {view === 'city' && selectedCity ? selectedCity.title : 'World Map'}
        </h1>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search — only in world view */}
          {view === 'world' && (
            <>
              <div className="relative hidden sm:block w-44">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#555]" />
                <Input
                  type="text"
                  placeholder="Search cities…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 border-[#1F1F1F] bg-[#111] pl-8 text-xs text-white placeholder:text-[#555] focus:border-[#F97316]/50 focus:ring-0"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-white">
                    <X className="size-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="sm:hidden p-1.5 text-[#A0A0A0] hover:text-white transition-colors"
              >
                <Search className="size-4" />
              </button>
            </>
          )}

          {/* Avatar + full dropdown */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(prev => !prev)}
              className="flex items-center gap-1 focus:outline-none"
            >
              <div className="size-7 rounded-full bg-[#F97316] flex items-center justify-center text-black text-xs font-bold select-none overflow-hidden">
                {avatarLetter ?? <User className="size-3.5" />}
              </div>
              <ChevronDown className={cn('size-3 text-[#555] transition-transform duration-150', avatarOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {avatarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute top-full right-0 mt-2 z-[60] w-52 bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm shadow-2xl overflow-hidden"
                >
                  {/* User info */}
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1A1A1A]">
                    <div className="size-8 rounded-full bg-[#F97316] flex items-center justify-center text-black text-sm font-bold shrink-0">
                      {avatarLetter ?? <User className="size-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{userName ?? 'Student'}</p>
                      <p className="text-[#555] text-xs truncate">Jnana Sethu</p>
                    </div>
                  </div>

                  {/* Nav links */}
                  <div className="border-b border-[#1A1A1A] py-1">
                    {NAV_ITEMS.map(({ icon: Icon, label, href, active }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setAvatarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[#161616]',
                          active ? 'text-[#F97316]' : 'text-[#A0A0A0] hover:text-white'
                        )}
                      >
                        <Icon className={cn('size-4', active ? 'text-[#F97316]' : 'text-[#555]')} />
                        {label}
                      </Link>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#1A1A1A]">
                    <div className="flex items-center gap-1.5">
                      <Zap className="size-3 text-[#F97316]" />
                      <span className="text-[#A0A0A0] text-xs">{tokenCount} Bolts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 text-[#555]" />
                      <span className="text-[#A0A0A0] text-xs">{todayMinutes}m today</span>
                    </div>
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#A0A0A0] hover:text-[#F97316] hover:bg-[#161616] transition-colors"
                  >
                    <LogOut className="size-4 text-[#555]" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile search bar */}
      <AnimatePresence>
        {searchOpen && view === 'world' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden border-b border-[#1F1F1F] overflow-hidden z-40 bg-[#0A0A0A]"
          >
            <div className="px-3 py-2 flex items-center gap-2">
              <Search className="size-4 text-[#555] flex-shrink-0" />
              <input
                type="text"
                placeholder="Search cities…"
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
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                className="text-[#555] text-xs"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map Canvas ── */}
      <main className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'world' ? (
            <motion.div
              key="world"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              ref={mapRef}
              className={cn(
                'absolute inset-0 touch-none select-none',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              )}
              style={{ background: '#0A0A0A' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Dot grid texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #222 1px, transparent 1px)',
                  backgroundSize: '36px 36px',
                  opacity: 0.55,
                }}
              />
              {/* Radial atmosphere */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(15,20,15,0.9) 0%, transparent 65%)' }}
              />
              {/* Decorative markers */}
              {MAP_DECORATIONS.map((d, i) => (
                <span
                  key={i}
                  className="absolute pointer-events-none select-none text-[#1E1E1E] text-xs font-mono"
                  style={{ left: d.left, top: d.top, transform: 'translate(-50%,-50%)' }}
                >
                  {d.type}
                </span>
              ))}

              {/* Panned map content */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                <CityConnections
                  cities={mappedCities}
                  connections={CITY_CONNECTIONS}
                  highlightCity={searchQuery ? filteredCities.map(c => c.slug) : undefined}
                />
                {mappedCities.map((city) => (
                  <CityNode
                    key={city.id}
                    city={city}
                    onClick={() => handleCityClick(city)}
                    isFiltered={searchQuery ? !filteredCities.includes(city) : false}
                    isMobile={isMobile}
                  />
                ))}
              </div>

              {searchQuery && filteredCities.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-[#111]/90 border border-[#1F1F1F] rounded-sm px-5 py-3 text-center backdrop-blur">
                    <p className="text-sm text-[#A0A0A0]">No cities found for &quot;{searchQuery}&quot;</p>
                  </div>
                </div>
              )}

              {/* City card — bottom sheet on mobile, centered overlay on desktop */}
              <CityCard
                city={cityCard}
                isMobile={isMobile}
                onClose={() => setCityCard(null)}
                onExplore={handleExploreCity}
              />
            </motion.div>
          ) : (
            <motion.div
              key="city"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {selectedCity && (
                <CityView
                  city={selectedCity}
                  levels={selectedCity.levels}
                  onBack={handleBackToWorld}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </>
  )
}
