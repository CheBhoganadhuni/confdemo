'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const handleGoogleSignIn = async () => {
    // Placeholder for Supabase auth
    // const { data, error } = await supabase.auth.signInWithOAuth({
    //   provider: 'google',
    //   options: {
    //     redirectTo: `${window.location.origin}/auth/callback`,
    //   },
    // })
    // TODO: Implement Supabase auth when connected
    // const { data, error } = await supabase.auth.signInWithOAuth({
    //   provider: 'google',
    //   options: {
    //     redirectTo: `${window.location.origin}/auth/callback`,
    //   },
    // })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="bg-[#111111] border border-[#1F1F1F] max-w-sm p-8"
      >
        {/* Brand Label */}
        <span className="text-[10px] tracking-widest text-[#F97316] mb-4 block">
          JNANA SETHU
        </span>

        {/* Heading */}
        <DialogTitle className="text-white font-bold text-xl">
          Continue your journey
        </DialogTitle>

        {/* Subtext */}
        <DialogDescription className="text-[#A0A0A0] text-sm mt-1">
          Sign in with your Google account.
        </DialogDescription>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="mt-6 w-full bg-[#F97316] hover:bg-[#EA6B0A] text-black h-11 rounded-sm text-sm font-bold tracking-wide flex items-center justify-center gap-3 transition-colors"
        >
          {/* Google Icon */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="mt-5 mb-4 border-t border-[#1F1F1F]" />

        {/* Footer Text */}
        <p className="text-[#555] text-xs text-center">
          Your account already exists if your faculty registered you.
        </p>
      </DialogContent>
    </Dialog>
  )
}
