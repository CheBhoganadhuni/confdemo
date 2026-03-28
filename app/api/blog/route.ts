import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function GET(req: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { supabase, userId } = auth
  const { searchParams } = new URL(req.url)
  const visibility = searchParams.get('visibility') || 'university'
  const tag = searchParams.get('tag')
  const sort = searchParams.get('sort') || 'recent'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const search = searchParams.get('search')?.trim() || ''
  const limit = 10
  const offset = (page - 1) * limit

  // Get current user's university
  const { data: currentUser } = await supabase
    .from('users')
    .select('university_id')
    .eq('id', userId)
    .single()

  let query = supabase
    .from('blog_posts')
    .select(
      `*, author:users!blog_posts_author_id_fkey(id, name, avatar_url, university_id), university:universities!blog_posts_university_id_fkey(name, slug)`,
      { count: 'exact' }
    )
    // Show approved+published posts to everyone, AND always show the
    // current user's own posts (so they can manage drafts/unpublished)
    .or(`and(is_published.eq.true,moderation_status.eq.approved),author_id.eq.${userId}`)

  if (visibility === 'university' && currentUser?.university_id) {
    query = query.eq('university_id', currentUser.university_id)
  } else {
    // For global: published+approved global posts OR author's own global posts
    query = query.or(`visibility.eq.global,author_id.eq.${userId}`)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (sort === 'popular') {
    query = query.order('upvote_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: posts, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check which posts current user has upvoted
  const postIds = (posts || []).map(p => p.id)
  let upvotedSet = new Set<string>()

  if (postIds.length > 0) {
    const { data: upvotes } = await supabase
      .from('blog_upvotes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)

    upvotedSet = new Set((upvotes || []).map(u => u.post_id))
  }

  const enriched = (posts || []).map(p => ({
    ...p,
    has_upvoted: upvotedSet.has(p.id),
  }))

  return NextResponse.json({
    posts: enriched,
    total: count ?? 0,
    page,
  })
}
