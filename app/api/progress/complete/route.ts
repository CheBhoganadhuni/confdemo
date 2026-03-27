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
      .select('today_time_minutes')
      .eq('id', userId)
      .single()
    return NextResponse.json({
      success: true,
      today_time_minutes: userData?.today_time_minutes ?? 0,
      level_completed: false,
      already_completed: true,
    })
  }

  // Get user's time tracking fields
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('today_time_minutes, today_date')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const today = new Date().toISOString().split('T')[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let todayMinutes = (user as any).today_date !== today ? 0 : (user.today_time_minutes ?? 0)

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

  // Update user time
  await supabase.from('users').update({
    today_time_minutes: newTodayMinutes,
    today_date: today,
  }).eq('id', userId)

  // Auto-set bolt_status.study = true when study time hits 120 min
  if (newTodayMinutes >= 120) {
    await supabase
      .from('bolt_status')
      .upsert({ user_id: userId, study: true }, { onConflict: 'user_id' })
  }

  // Check level completion for toast notification
  let levelCompleted = false
  let levelSlug: string | undefined

  const { data: levelLinks } = await supabase
    .from('level_components')
    .select('level_id, levels(id, slug)')
    .eq('component_id', component_id)

  for (const link of levelLinks ?? []) {
    const levelId = link.level_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const level = (link as any).levels

    const { data: siblingComps } = await supabase
      .from('level_components')
      .select('component_id')
      .eq('level_id', levelId)

    const siblingIds = (siblingComps ?? []).map((c: { component_id: string }) => c.component_id)
    if (!siblingIds.length) continue

    const { count: doneCount } = await supabase
      .from('user_component_progress')
      .select('component_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('component_id', siblingIds)

    if (doneCount === siblingIds.length) {
      levelCompleted = true
      levelSlug = level?.slug
      break
    }
  }

  return NextResponse.json({
    success: true,
    today_time_minutes: newTodayMinutes,
    level_completed: levelCompleted,
    level_slug: levelSlug,
  })
}
