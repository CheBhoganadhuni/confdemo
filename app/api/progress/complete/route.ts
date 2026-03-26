import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = await req.json().catch(() => null)
  const { component_id, road_id } = body ?? {}

  if (!component_id) {
    return NextResponse.json({ error: 'component_id required' }, { status: 400 })
  }

  // Verify component exists and is published
  const { data: component, error: compError } = await supabase
    .from('components')
    .select('id, duration_minutes')
    .eq('id', component_id)
    .eq('is_published', true)
    .single()

  if (compError || !component) {
    return NextResponse.json({ error: 'Component not found' }, { status: 404 })
  }

  // Check if already completed — idempotent
  const { data: existingProgress } = await supabase
    .from('user_component_progress')
    .select('status')
    .eq('user_id', userId)
    .eq('component_id', component_id)
    .single()

  if (existingProgress?.status === 'completed') {
    const { data: userData } = await supabase
      .from('users')
      .select('xp_points, today_time_minutes')
      .eq('id', userId)
      .single()
    return NextResponse.json({
      success: true,
      xp_earned: 0,
      new_xp: userData?.xp_points ?? 0,
      today_time_minutes: userData?.today_time_minutes ?? 0,
      level_completed: false,
      already_completed: true,
    })
  }

  // Get user's time tracking fields
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('today_time_minutes, today_date, xp_points')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const today = new Date().toISOString().split('T')[0]
  let todayMinutes = user.today_time_minutes ?? 0

  // Reset daily counter if it's a new day
  if ((user as any).today_date !== today) {
    todayMinutes = 0
    await supabase
      .from('users')
      .update({ today_time_minutes: 0, today_date: today })
      .eq('id', userId)
  }

  const duration = component.duration_minutes ?? 0

  // Daily limit check (120 min)
  if (todayMinutes + duration > 120) {
    return NextResponse.json(
      { error: 'daily_limit', message: 'Daily study limit reached. Come back tomorrow.' },
      { status: 429 }
    )
  }

  // Upsert progress
  const now = new Date().toISOString()
  await supabase.from('user_component_progress').upsert(
    {
      user_id: userId,
      component_id,
      status: 'completed',
      completed_at: now,
      earned_on_road_id: road_id ?? null,
    },
    { onConflict: 'user_id,component_id' }
  )

  const newTodayMinutes = todayMinutes + duration
  let xpEarned = 10
  const newXp = (user.xp_points ?? 0) + xpEarned

  // Update user stats
  await supabase.from('users').update({
    today_time_minutes: newTodayMinutes,
    today_date: today,
    xp_points: newXp,
  }).eq('id', userId)

  // Check level completion for bonus XP
  let levelCompleted = false
  let levelSlug: string | undefined

  const { data: levelLinks } = await supabase
    .from('level_components')
    .select('level_id, levels(id, slug)')
    .eq('component_id', component_id)

  for (const link of levelLinks ?? []) {
    const levelId = link.level_id
    const level = (link as any).levels

    // All component IDs in this level
    const { data: siblingComps } = await supabase
      .from('level_components')
      .select('component_id')
      .eq('level_id', levelId)

    const siblingIds = (siblingComps ?? []).map(c => c.component_id)
    if (siblingIds.length === 0) continue

    const { count: doneCount } = await supabase
      .from('user_component_progress')
      .select('component_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('component_id', siblingIds)

    if (doneCount === siblingIds.length) {
      levelCompleted = true
      levelSlug = level?.slug
      xpEarned += 50
      // Credit the level bonus XP
      await supabase.from('users')
        .update({ xp_points: newXp + 50 })
        .eq('id', userId)
      break
    }
  }

  return NextResponse.json({
    success: true,
    xp_earned: xpEarned,
    new_xp: newXp + (levelCompleted ? 50 : 0),
    today_time_minutes: newTodayMinutes,
    level_completed: levelCompleted,
    level_slug: levelSlug,
  })
}
