import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const action = searchParams.get('action') // 'sync_github' | 'sync_linkedin' | null
  const next = searchParams.get('next') ?? '/world'

  if (!code) return NextResponse.redirect(`${origin}/`)

  const supabase = await createClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(`${origin}/?error=auth_failed`)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/?error=auth_failed`)

  // ── Identity linking callbacks (user is already logged in) ─────────────────
  if (action === 'sync_github' || action === 'sync_linkedin') {
    const { data: identitiesData } = await supabase.auth.getUserIdentities()
    const identities = identitiesData?.identities ?? []

    if (action === 'sync_github') {
      const gh = identities.find(i => i.provider === 'github')
      const login =
        (gh?.identity_data?.user_name as string | undefined) ??
        (gh?.identity_data?.preferred_username as string | undefined) ??
        (gh?.identity_data?.login as string | undefined)
      if (login) {
        await supabase.from('users').update({ github_id: login }).eq('id', user.id)
      }
    }

    if (action === 'sync_linkedin') {
      const li = identities.find(i => i.provider === 'linkedin_oidc')
      const linkedinId =
        (li?.identity_data?.sub as string | undefined) ??
        (li?.identity_data?.id as string | undefined) ??
        (li?.identity_data?.email as string | undefined)
      if (linkedinId) {
        await supabase.from('users').update({ linkedin_id: linkedinId }).eq('id', user.id)
      }
    }

    // Return to wherever the user came from (e.g. /profile)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // ── Normal login / sign-up flow ────────────────────────────────────────────
  const email = user.email!.toLowerCase()

  const { data: existingUser } = await supabase
    .from('users')
    .select('id, role, university_id, universities(access)')
    .eq('id', user.id)
    .single()

  if (existingUser) {
    if (existingUser.role !== 'student') {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/?error=not_a_student`)
    }
    const univ = existingUser.universities as { access: boolean } | null
    if (univ && univ.access === false) {
      return NextResponse.redirect(`${origin}/?error=suspended`)
    }
    return NextResponse.redirect(`${origin}/world`)
  }

  // New user — check whitelist
  const { data: preReg } = await supabase
    .from('pre_registered_students')
    .select('*, universities(id, access), departments(id)')
    .ilike('email', email)
    .single()

  if (!preReg) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/?error=not_registered`)
  }

  const univ = preReg.universities as { id: string; access: boolean } | null
  if (univ && univ.access === false) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/?error=suspended`)
  }

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split('@')[0]

  const { error: insertError } = await supabase.from('users').insert({
    id: user.id,
    name,
    email: user.email,
    avatar_url: user.user_metadata?.avatar_url || null,
    role: 'student',
    university_id: preReg.university_id,
    department_id: preReg.department_id || null,
    year: preReg.year || null,
    onboarding_complete: false,
    xp_points: 0,
    token_count: 0,
    today_time_minutes: 0,
    today_date: new Date().toISOString().split('T')[0],
  })

  if (insertError) {
    console.error('User insert error:', insertError)
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  return NextResponse.redirect(`${origin}/world`)
}
