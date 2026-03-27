'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Zap, Menu, User, LogOut } from 'lucide-react'
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
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SignInModal } from '@/components/auth/sign-in-modal'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/utils'

interface AuthUser {
  name: string
  today_time_minutes: number
  token_count: number
}

export function Navbar() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/user/me')
      .then(res => {
        if (!res.ok) {
          setAuthUser(null)
          return null
        }
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
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[rgba(10,10,10,0.85)] backdrop-blur-md border-b border-[#1F1F1F]">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-bold tracking-tight text-white text-lg">
            Jnana Sethu<span className="text-[#F97316]">.</span>
          </Link>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-6">
            {authUser ? (
              <>
                {/* Study Time */}
                <div className="flex items-center gap-1.5 text-xs text-[#A0A0A0]">
                  <Clock className="w-4 h-4" />
                  <span>{studyTime}</span>
                </div>

                {/* Bolts */}
                <div className="flex items-center gap-1.5">
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
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2 text-white hover:text-[#F97316] transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0A0A0A] border-l border-[#1F1F1F] w-72">
                <SheetHeader>
                  <SheetTitle className="text-white font-bold tracking-tight text-left">
                    Jnana Sethu<span className="text-[#F97316]">.</span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">Navigation menu</SheetDescription>
                </SheetHeader>

                <div className="mt-8 flex flex-col gap-4">
                  {authUser ? (
                    <>
                      {/* User Info */}
                      <div className="flex items-center gap-3 pb-4 border-b border-[#1F1F1F]">
                        <div className="w-10 h-10 rounded-full bg-[#F97316] text-black font-bold text-sm flex items-center justify-center">
                          {getInitial(authUser.name)}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{authUser.name}</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between py-3 px-2 bg-[#111111] rounded-sm">
                        <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                          <Clock className="w-4 h-4" />
                          <span>Today</span>
                        </div>
                        <span className="text-white text-sm">{studyTime}</span>
                      </div>

                      <div className="flex items-center justify-between py-3 px-2 bg-[#111111] rounded-sm">
                        <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
                          <Zap className="w-4 h-4 text-[#F97316]" />
                          <span>Bolts</span>
                        </div>
                        <span className="text-white text-sm">{bolts}</span>
                      </div>

                      {/* Links */}
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-3 text-white hover:text-[#F97316] transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>

                      <button
                        onClick={() => {
                          handleSignOut()
                          setMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-3 py-3 text-[#A0A0A0] hover:text-white transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setSignInOpen(true)
                      }}
                      className="w-full bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold py-3 rounded-sm transition-colors"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Sign In Modal */}
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </>
  )
}
