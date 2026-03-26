import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const flow = searchParams.get('flow') || 'login'

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (authError || !authData.user) {
      console.error('[Auth Callback] Exchange error:', authError)
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }

    const authUser = authData.user
    const userEmail = authUser.email

    // Flow: signup — NOT USED IN PHASE 1
    if (flow === 'signup') {
      // Sign out and redirect with error
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/?error=use_login`)
    }

    // Flow: login
    if (flow === 'login') {
      // Check if user exists in public.users
      const { data: existingUser } = await supabase
        .from('users')
        .select(`
          id,
          role,
          university_id,
          universities!inner (
            id,
            access
          )
        `)
        .eq('id', authUser.id)
        .single()

      if (existingUser) {
        // User exists - check university access
        const university = existingUser.universities as { id: string; access: boolean } | null
        
        if (university && !university.access) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/?error=suspended`)
        }

        // All good - redirect to /world
        return NextResponse.redirect(`${origin}/world`)
      }

      // User doesn't exist - check pre_registered_students
      const { data: preRegistered } = await supabase
        .from('pre_registered_students')
        .select(`
          id,
          email,
          university_id,
          department_id,
          universities!inner (
            id,
            access
          )
        `)
        .eq('email', userEmail)
        .single()

      if (preRegistered) {
        // Found pre-registration - create user record
        const university = preRegistered.universities as { id: string; access: boolean } | null

        // Check university access before creating user
        if (university && !university.access) {
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/?error=suspended`)
        }

        // Create the user record
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: userEmail,
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
            avatar_url: authUser.user_metadata?.avatar_url || null,
            university_id: preRegistered.university_id,
            department_id: preRegistered.department_id,
            role: 'student',
          })

        if (createError) {
          console.error('[Auth Callback] Create user error:', createError)
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/?error=auth_failed`)
        }

        // Redirect to /world
        return NextResponse.redirect(`${origin}/world`)
      }

      // No user and no pre-registration - sign out and show error
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/?error=not_registered`)
    }
  }

  // No code or unknown flow - redirect to home
  return NextResponse.redirect(`${origin}/`)
}
