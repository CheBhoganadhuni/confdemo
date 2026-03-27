import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  // Check if GitHub identity is already linked
  const { data: identitiesData } = await supabase.auth.getUserIdentities()
  const githubIdentity = identitiesData?.identities?.find(i => i.provider === 'github')

  if (!githubIdentity) {
    // Not linked — generate the OAuth link URL
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'github',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/profile`,
      },
    })
    if (error || !data?.url) {
      return NextResponse.json(
        { error: 'link_failed', message: 'Could not generate GitHub link URL.' },
        { status: 500 }
      )
    }
    return NextResponse.json({ needs_linking: true, url: data.url })
  }

  // Already linked — extract username and sync to users table
  const identityData = (githubIdentity.identity_data ?? {}) as Record<string, unknown>
  const githubUsername =
    (identityData.user_name as string | undefined) ??
    (identityData.preferred_username as string | undefined) ??
    undefined

  if (githubUsername) {
    await supabase
      .from('users')
      .update({ github_username: githubUsername })
      .eq('id', user.id)
  }

  return NextResponse.json({
    success: true,
    github_username: githubUsername ?? null,
  })
}
