import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { supabase, userId } = auth
  const { slug } = await params

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(
      `*, author:users!blog_posts_author_id_fkey(id, name, avatar_url, university_id), university:universities!blog_posts_university_id_fkey(name, slug)`
    )
    .eq('slug', slug)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  // If post is unpublished, only author can see it
  if (!post.is_published && post.author_id !== userId) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  // If post is not approved and user is not author
  if (post.moderation_status !== 'approved' && post.author_id !== userId) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  // Visibility check: university-only posts
  if (post.visibility === 'university' && post.university_id) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('university_id')
      .eq('id', userId)
      .single()

    if (currentUser?.university_id !== post.university_id) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }
  }

  // Check if current user has upvoted
  const { data: upvote } = await supabase
    .from('blog_upvotes')
    .select('id')
    .eq('post_id', post.id)
    .eq('user_id', userId)
    .maybeSingle()

  return NextResponse.json({
    ...post,
    has_upvoted: !!upvote,
  })
}
