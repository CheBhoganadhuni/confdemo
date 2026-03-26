import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected = ['/world', '/road', '/profile'].some(p => pathname.startsWith(p))

  // Not logged in + trying to access protected route → home
  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Logged in + accessing protected route → verify they are a student
  if (user && isProtected) {
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // No user row yet (mid-signup flow) — let callback handle it
    if (!userRow) return supabaseResponse

    // Not a student → sign out and redirect home with error
    if (userRow.role !== 'student') {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/?error=not_a_student', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)',
  ],
}

// Next.js 16 alias
export { proxy as middleware }
