'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Sign in failed. Please try again.',
  not_registered: 'Your email is not registered. Ask your faculty to add you.',
  suspended: 'Your university access is suspended. Contact your faculty.',
  not_a_student: 'This account is not registered as a student. Use a different account.',
}

export function AuthErrorToast() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error && ERROR_MESSAGES[error]) {
      toast.error(ERROR_MESSAGES[error], { duration: 6000 })
      router.replace('/', { scroll: false })
    }
  }, [searchParams, router])

  return null
}
