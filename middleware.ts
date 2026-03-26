import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
const AUTH_ROUTES = ['/world', '/road', '/profile']

// Routes that require specific roles
const ADMIN_ROUTES = ['/admin']
const FACULTY_ROUTES = ['/faculty']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Refresh session on every request
  const { supabase, user, response } = await updateSession(request)

  // Public routes - always accessible
  if (pathname === '/' || pathname.startsWith('/auth')) {
    return response
  }

  // Check if route requires authentication
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  const isFacultyRoute = FACULTY_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Routes requiring auth: redirect to home if not authenticated
  if (isAuthRoute || isAdminRoute || isFacultyRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Admin routes: check role
  if (isAdminRoute && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'platform_admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Faculty routes: check role (faculty or platform_admin)
  if (isFacultyRoute && user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'faculty' && userData.role !== 'platform_admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
