import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BlogFeedClient } from '@/components/blog/blog-feed-client'

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Fetch initial posts (university, recent, page 1)
  const { data: currentUser } = await supabase
    .from('users')
    .select('university_id, last_blog_at')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('blog_posts')
    .select(
      `*, author:users!blog_posts_author_id_fkey(id, name, avatar_url, university_id), university:universities!blog_posts_university_id_fkey(name, slug)`,
      { count: 'exact' }
    )
    // Show approved+published posts to everyone, AND always show the
    // current user's own posts (so they can manage drafts/unpublished)
    .or(`and(is_published.eq.true,moderation_status.eq.approved),author_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .range(0, 9)

  if (currentUser?.university_id) {
    query = query.eq('university_id', currentUser.university_id)
  }

  const { data: posts, count } = await query

  // Check upvotes
  const postIds = (posts || []).map(p => p.id)
  let upvotedSet = new Set<string>()
  if (postIds.length > 0) {
    const { data: upvotes } = await supabase
      .from('blog_upvotes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)
    upvotedSet = new Set((upvotes || []).map(u => u.post_id))
  }

  const enriched = (posts || []).map(p => ({
    ...p,
    has_upvoted: upvotedSet.has(p.id),
  }))

  return (
    <BlogFeedClient
      initialPosts={enriched}
      totalCount={count ?? 0}
      userId={user.id}
      canPost={
        !currentUser?.last_blog_at ||
        (Date.now() - new Date(currentUser.last_blog_at).getTime()) / 3600000 >= 24
      }
    />
  )
}
