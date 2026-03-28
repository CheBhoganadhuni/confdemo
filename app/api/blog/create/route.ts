import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'
import { generateSlug } from '@/lib/utils'
import { BLOG_TAGS } from '@/lib/types/database'

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const { supabase, userId } = auth
  const body = await req.json()
  const { title, body: postBody, tags, visibility } = body as {
    title: string
    body: string
    tags: string[]
    visibility: string
  }

  // Validations
  if (!title || title.length < 5 || title.length > 150) {
    return NextResponse.json({ error: 'Title must be 5–150 characters.' }, { status: 400 })
  }
  if (!postBody || postBody.length < 50 || postBody.length > 10000) {
    return NextResponse.json({ error: 'Body must be 50–10,000 characters.' }, { status: 400 })
  }
  if (!Array.isArray(tags) || tags.length < 1 || tags.length > 5) {
    return NextResponse.json({ error: 'Select 1 to 5 tags.' }, { status: 400 })
  }
  const validTags = new Set<string>(BLOG_TAGS)
  if (tags.some(t => !validTags.has(t))) {
    return NextResponse.json({ error: 'Invalid tag selected.' }, { status: 400 })
  }
  if (visibility !== 'global' && visibility !== 'university') {
    return NextResponse.json({ error: 'Invalid visibility.' }, { status: 400 })
  }

  // Get user info
  const { data: user } = await supabase
    .from('users')
    .select('last_blog_at, university_id')
    .eq('id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  // Daily limit check
  if (user.last_blog_at) {
    const hoursSince = (Date.now() - new Date(user.last_blog_at).getTime()) / 3600000
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince)
      return NextResponse.json({
        error: 'daily_limit',
        message: `You can post again in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}.`,
      }, { status: 429 })
    }
  }

  // Moderation
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  try {
    const modRes = await fetch(`${baseUrl}/api/blog/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body: postBody, tags }),
    })
    const { approved, reason } = await modRes.json()

    if (!approved) {
      return NextResponse.json({
        error: 'moderation_rejected',
        message: reason || 'Post was rejected by content moderation.',
      }, { status: 400 })
    }
  } catch {
    // Fail open if moderation service is down
  }

  // Generate slug
  const slug = generateSlug(title) + '-' + Date.now().toString(36)

  // Insert post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      author_id: userId,
      university_id: user.university_id,
      slug,
      title,
      body: postBody,
      tags,
      visibility,
      moderation_status: 'approved',
      is_published: true,
    })
    .select('slug')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update last_blog_at
  await supabase
    .from('users')
    .update({ last_blog_at: new Date().toISOString() })
    .eq('id', userId)

  return NextResponse.json({ success: true, slug: post.slug })
}
