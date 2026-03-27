import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    // Check if LinkedIn identity is already linked
    const { data: identitiesData } = await supabase.auth.getUserIdentities()
    const linkedinIdentity = identitiesData?.identities?.find(
      i => i.provider === 'linkedin_oidc'
    )

    if (!linkedinIdentity) {
      // Not linked — generate the OAuth link URL
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/profile`,
        },
      })
      if (error || !data?.url) {
        return NextResponse.json(
          { error: 'link_failed', message: 'Could not generate LinkedIn link URL.' },
          { status: 500 }
        )
      }
      return NextResponse.json({ needs_linking: true, url: data.url })
    }

    // Already linked — extract LinkedIn ID
    const identityData = (linkedinIdentity.identity_data ?? {}) as Record<string, unknown>
    const linkedinId =
      (identityData.sub as string | undefined) ??
      (identityData.id as string | undefined) ??
      (identityData.email as string | undefined) ??
      undefined

    if (linkedinId) {
      // Check uniqueness — another user might already have this linkedin_id
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('linkedin_id', linkedinId)
        .neq('id', user.id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          {
            error: 'already_linked',
            message: 'This LinkedIn account is already linked to another user.',
          },
          { status: 400 }
        )
      }

      await supabase
        .from('users')
        .update({ linkedin_id: linkedinId })
        .eq('id', user.id)
    }

    return NextResponse.json({
      success: true,
      linkedin_id: linkedinId ?? null,
    })
  } catch (error) {
    console.error('connect-linkedin error:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
