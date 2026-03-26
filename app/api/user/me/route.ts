import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const { data: user, error } = await supabase
    .from('users')
    .select('name, avatar_url, role, xp_points, token_count, today_time_minutes, university_id, universities(name), departments(name)')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Count unread notifications from last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const universityId = (user as any).university_id as string | null

  const orParts = [`type.eq.global`, `user_id.eq.${userId}`]
  if (universityId) {
    orParts.push(`and(type.eq.university,university_id.eq.${universityId})`)
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo)
    .or(orParts.join(','))

  return NextResponse.json({
    name: (user as any).name,
    avatar_url: (user as any).avatar_url ?? null,
    role: (user as any).role,
    xp_points: (user as any).xp_points,
    token_count: (user as any).token_count,
    today_time_minutes: (user as any).today_time_minutes,
    university_name: (user as any).universities?.name ?? null,
    department_name: (user as any).departments?.name ?? null,
    unread_notification_count: unreadCount ?? 0,
  })
}
