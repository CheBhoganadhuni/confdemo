'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ChevronDown, User, Home, Map, Route, LogOut, Zap, Clock, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSignOut } from '@/hooks/use-sign-out'
import { PageLoader } from '@/components/ui/page-loader'

interface UserAvatarMenuProps {
  userName?: string
  tokenCount?: number
  todayMinutes?: number
  activeRoute?: string
}

export function UserAvatarMenu({
  userName,
  tokenCount = 0,
  todayMinutes = 0,
  activeRoute = '',
}: UserAvatarMenuProps) {
  const { signOut, signingOut } = useSignOut()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : null

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleSignOut = () => {
    setOpen(false)
    signOut()
  }

  const NAV = [
    { icon: Home,     label: 'Home',      href: '/'        },
    { icon: Map,      label: 'World Map', href: '/world'   },
    { icon: Route,    label: 'Roads',     href: '/road'    },
    { icon: BookOpen, label: 'Blog',      href: '/blog'    },
    { icon: User,     label: 'Profile',   href: '/profile' },
  ]

  return (
    <>
    {signingOut && <PageLoader />}
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1 focus:outline-none"
      >
        <div className="size-7 rounded-full bg-[#F97316] flex items-center justify-center text-black text-xs font-bold select-none">
          {avatarLetter ?? <User className="size-3.5" />}
        </div>
        <ChevronDown className={cn('size-3 text-[#555] transition-transform duration-150', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
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
                <p className="text-[#555] text-xs">Jnana Sethu</p>
              </div>
            </div>

            {/* Nav links */}
            <div className="border-b border-[#1A1A1A] py-1">
              {NAV.map(({ icon: Icon, label, href }) => {
                const active = activeRoute === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[#161616]',
                      active ? 'text-[#F97316]' : 'text-[#A0A0A0] hover:text-white'
                    )}
                  >
                    <Icon className={cn('size-4', active ? 'text-[#F97316]' : 'text-[#555]')} />
                    {label}
                  </Link>
                )
              })}
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
    </>
  )
}
