'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useSignOut() {
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  const signOut = async () => {
    setSigningOut(true)
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return { signOut, signingOut }
}
