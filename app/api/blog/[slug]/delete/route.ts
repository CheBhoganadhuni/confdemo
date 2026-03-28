import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { supabase, userId } = auth
  const { slug } = await params

  // Get post to check ownership
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, author_id')
    .eq('slug', slug)
    .single()

  if (!post || post.author_id !== userId) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', post.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
