import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { supabase, userId } = auth
  const { slug } = await params
  const body = await req.json() as {
    is_published?: boolean
    visibility?: 'global' | 'university'
  }

  const updateData: Record<string, unknown> = {}
  if (body.is_published !== undefined) updateData.is_published = body.is_published
  if (body.visibility !== undefined) updateData.visibility = body.visibility

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('slug', slug)
    .eq('author_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
