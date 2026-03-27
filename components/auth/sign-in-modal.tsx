'use client'

import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?flow=login`,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-[#161616] border border-[#252525] !rounded-2xl max-w-xs w-full p-0 shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-[#444] hover:text-[#aaa] transition-colors z-10"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        {/* Logo circle */}
        <div className="flex justify-center pt-10 pb-6">
          <div className="size-24 rounded-full overflow-hidden ring-1 ring-[#2a2a2a] shadow-lg shadow-black/60">
            <Image
              src="/logo.png"
              alt="Jnana Sethu"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Text */}
        <div className="px-8 text-center">
          <DialogTitle className="text-white font-black text-2xl tracking-tight leading-snug">
            Continue your journey
          </DialogTitle>
          <DialogDescription className="text-[#555] text-sm mt-2 leading-relaxed">
            Sign in to access your map.
          </DialogDescription>
        </div>

        {/* Google button */}
        <div className="px-8 mt-8 mb-2">
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-[#F97316] hover:bg-[#ea6c0e] active:bg-[#dc6209] text-white h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-colors duration-150 shadow-md shadow-[#F97316]/20"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#fff" fillOpacity=".9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" fillOpacity=".75" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" fillOpacity=".6" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#fff" fillOpacity=".85" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <p className="text-[#383838] text-[11px] text-center px-8 py-6 leading-relaxed">
          Your account exists if your faculty registered you.
        </p>
      </DialogContent>
    </Dialog>
  )
}
