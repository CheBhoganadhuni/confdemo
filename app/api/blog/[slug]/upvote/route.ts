import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { supabase, userId } = auth
  const { slug } = await params

  // Get post
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, upvote_count')
    .eq('slug', slug)
    .single()

  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  // Check existing upvote
  const { data: existing } = await supabase
    .from('blog_upvotes')
    .select('id')
    .eq('post_id', post.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    // Remove upvote
    await supabase.from('blog_upvotes').delete().eq('id', existing.id)
    await supabase
      .from('blog_posts')
      .update({ upvote_count: Math.max(0, post.upvote_count - 1) })
      .eq('id', post.id)

    return NextResponse.json({
      upvoted: false,
      new_count: Math.max(0, post.upvote_count - 1),
    })
  } else {
    // Add upvote
    await supabase
      .from('blog_upvotes')
      .insert({ post_id: post.id, user_id: userId })
    await supabase
      .from('blog_posts')
      .update({ upvote_count: post.upvote_count + 1 })
      .eq('id', post.id)

    return NextResponse.json({
      upvoted: true,
      new_count: post.upvote_count + 1,
    })
  }
}
