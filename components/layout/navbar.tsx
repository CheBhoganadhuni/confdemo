'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Clock, Zap, Menu, User, LogOut, Home, Map, Route, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { SignInModal } from '@/components/auth/sign-in-modal'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/utils'

interface AuthUser {
  name: string
  today_time_minutes: number
  token_count: number
}

const NAV_LINKS = [
  { href: '/',        label: 'Home',    Icon: Home  },
  { href: '/world',   label: 'World',   Icon: Map   },
  { href: '/road',    label: 'Roads',   Icon: Route },
  { href: '/profile', label: 'Profile', Icon: User  },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/user/me')
      .then(res => {
        if (!res.ok) { setAuthUser(null); return null }
        return res.json()
      })
      .then((data: AuthUser | null) => {
        if (data) setAuthUser(data)
      })
      .catch(() => setAuthUser(null))
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setAuthUser(null)
    router.push('/')
    router.refresh()
  }

  const getInitial = (name: string) => name.charAt(0).toUpperCase()
  const studyTime = authUser ? formatDuration(authUser.today_time_minutes) : '0h 0m'
  const bolts = authUser?.token_count ?? 0

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[rgba(10,10,10,0.90)] backdrop-blur-md border-b border-[#1F1F1F]">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-bold tracking-tight text-white text-lg flex-shrink-0">
            Jnana Sethu<span className="text-[#F97316]">.</span>
          </Link>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-1">
            {authUser ? (
              <>
                {/* Nav links */}
                <div className="flex items-center gap-1 mr-4">
                  {NAV_LINKS.slice(0, 3).map(({ href, label }) => {
                    const isActive = pathname === href
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                          isActive
                            ? 'text-white font-medium'
                            : 'text-[#A0A0A0] hover:text-white'
                        }`}
                      >
                        {label}
                      </Link>
                    )
                  })}
                </div>

                {/* Study Time */}
                <div className="flex items-center gap-1.5 text-xs text-[#A0A0A0] mr-3">
                  <Clock className="w-4 h-4" />
                  <span>{studyTime}</span>
                </div>

                {/* Bolts */}
                <div className="flex items-center gap-1.5 mr-4">
                  <Zap className="w-4 h-4 text-[#F97316]" />
                  <span className="text-sm text-white">{bolts}</span>
                </div>

                {/* Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-7 h-7 rounded-full bg-[#F97316] text-black font-bold text-xs flex items-center justify-center hover:bg-[#EA6B0A] transition-colors">
                      {getInitial(authUser.name)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#111111] border-[#1F1F1F]">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#1F1F1F]" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-[#A0A0A0] focus:text-white"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <button
                onClick={() => setSignInOpen(true)}
                className="border border-[#333] text-white text-sm px-4 py-1.5 rounded-sm hover:border-[#F97316] hover:text-[#F97316] transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-white hover:text-[#F97316] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sheet — custom clean implementation */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="bg-[#0A0A0A] border-l border-[#1F1F1F] w-72 p-0 flex flex-col [&>button]:hidden"
        >
          {/* Accessible title for screen readers */}
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          {/* Header */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-[#1F1F1F] flex-shrink-0">
            <span className="font-bold text-white text-base tracking-tight">
              Jnana Sethu<span className="text-[#F97316]">.</span>
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#555] hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {authUser ? (
            <div className="flex flex-col flex-1 overflow-y-auto">
              {/* User row */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1F1F1F]">
                <div className="w-9 h-9 rounded-full bg-[#F97316] text-black font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {getInitial(authUser.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">{authUser.name}</div>
                </div>
              </div>

              {/* Nav links */}
              <div className="py-2">
                {NAV_LINKS.map(({ href, label, Icon }) => {
                  const isActive = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                        isActive
                          ? 'bg-[#111] text-[#F97316]'
                          : 'text-white hover:bg-[#111]'
                      }`}
                    >
                      <Icon
                        className="w-[18px] h-[18px]"
                        style={{ color: isActive ? '#F97316' : '#A0A0A0' }}
                      />
                      <span className="text-sm">{label}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-[#1F1F1F] mx-5" />

              {/* Stats row */}
              <div className="flex items-center gap-4 px-5 py-3.5 text-xs text-[#555]">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#F97316]" />
                  {bolts} Bolts
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {studyTime} today
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-[#1F1F1F] mx-5" />

              {/* Sign Out */}
              <button
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 px-5 py-3.5 text-sm text-[#555] hover:text-[#F97316] transition-colors w-full mt-auto"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col flex-1 p-5">
              <p className="text-[#555] text-sm mb-4">
                Sign in to track your progress and access all features.
              </p>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setSignInOpen(true)
                }}
                className="w-full bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold py-3 rounded-sm transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sign In Modal */}
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  )
}
