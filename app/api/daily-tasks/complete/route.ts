import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

// Validate a GitHub commit URL and confirm the commit exists via public API
async function validateGitHubCommit(proofUrl: string): Promise<{ valid: boolean; reason?: string }> {
  let parsed: URL
  try {
    parsed = new URL(proofUrl)
  } catch {
    return { valid: false, reason: 'invalid_url' }
  }

  if (parsed.hostname !== 'github.com') {
    return { valid: false, reason: 'invalid_url' }
  }

  // Expected: /owner/repo/commit/sha
  const parts = parsed.pathname.split('/').filter(Boolean)
  if (parts.length < 4 || parts[2] !== 'commit') {
    return { valid: false, reason: 'invalid_commit' }
  }

  const [owner, repo, , sha] = parts

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`, {
      headers: { 'User-Agent': 'jnana-sethu-app' },
      signal: AbortSignal.timeout(5000),
    })
    if (res.status === 404) return { valid: false, reason: 'invalid_commit' }
    if (!res.ok) return { valid: false, reason: 'invalid_commit' }
    return { valid: true }
  } catch {
    // Network error — let it pass (don't block on GitHub API failures)
    return { valid: true }
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = await req.json().catch(() => null)
  const { task_id, proof_url } = body ?? {}

  if (!task_id) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 })
  }

  // Verify task exists and is active
  const { data: task, error: taskError } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('id', task_id)
    .eq('is_active', true)
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  // Verify unlock status
  if (task.unlock_after_city_slug) {
    const { data: city } = await supabase
      .from('cities').select('id').eq('slug', task.unlock_after_city_slug).single()
    if (city) {
      const { data: levels } = await supabase
        .from('levels').select('id').eq('city_id', city.id).eq('is_published', true)
      const levelIds = (levels ?? []).map(l => l.id)
      const { data: levelComps } = levelIds.length > 0
        ? await supabase.from('level_components').select('component_id').in('level_id', levelIds)
        : { data: [] }
      const compIds = (levelComps ?? []).map(lc => lc.component_id)

      if (compIds.length > 0) {
        const { count } = await supabase
          .from('user_component_progress')
          .select('component_id', { count: 'exact', head: true })
          .eq('user_id', userId).eq('status', 'completed').in('component_id', compIds)
        if ((count ?? 0) < compIds.length) {
          return NextResponse.json({ error: 'Task not yet unlocked.' }, { status: 403 })
        }
      }
    }
  }

  // GitHub commit validation
  if (task.type === 'github') {
    if (!proof_url) {
      return NextResponse.json({ error: 'proof_url required for GitHub task' }, { status: 400 })
    }
    const { valid, reason } = await validateGitHubCommit(proof_url)
    if (!valid) {
      return NextResponse.json({ error: reason ?? 'invalid_commit' }, { status: 400 })
    }
  }

  const today = new Date().toISOString().split('T')[0]

  // Upsert log (idempotent)
  await supabase.from('user_daily_logs').upsert(
    {
      user_id: userId,
      task_id,
      completed_on: today,
      proof_url: proof_url ?? null,
      proof_verified: false,
    },
    { onConflict: 'user_id,task_id,completed_on' }
  )

  // Check if all unlocked tasks are done today
  const { data: allTasks } = await supabase
    .from('daily_tasks').select('id, unlock_after_city_slug').eq('is_active', true)

  // Build unlocked task ids (simplified: include tasks with no city lock + ones already done)
  // Full check: re-evaluate unlock for each task
  const { data: todayLogs } = await supabase
    .from('user_daily_logs')
    .select('task_id')
    .eq('user_id', userId)
    .eq('completed_on', today)

  const doneTodaySet = new Set((todayLogs ?? []).map(l => l.task_id))

  // Simple unlock check: tasks with no lock are always unlocked
  // Tasks with lock are unlocked if city is complete — skip deep check here for speed
  // Treat all tasks without a city lock as the minimum check
  const unlockedTasks = (allTasks ?? []).filter(t => !t.unlock_after_city_slug)
  const allUnlockedDone = unlockedTasks.length > 0 && unlockedTasks.every(t => doneTodaySet.has(t.id))

  if (!allUnlockedDone) {
    return NextResponse.json({ success: true, all_done: false, token_earned: false })
  }

  // All unlocked tasks done — check token eligibility
  const { data: user } = await supabase
    .from('users')
    .select('token_count, current_cycle_start')
    .eq('id', userId)
    .single()

  const now = new Date()
  const cycleStart = user?.current_cycle_start ? new Date(user.current_cycle_start) : null
  const canEarnToken = !cycleStart || now >= cycleStart

  if (!canEarnToken) {
    return NextResponse.json({ success: true, all_done: true, token_earned: false })
  }

  const newTokenCount = (user?.token_count ?? 0) + 1
  const nextCycleStart = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()

  await supabase.from('users').update({
    token_count: newTokenCount,
    last_token_at: now.toISOString(),
    current_cycle_start: nextCycleStart,
  }).eq('id', userId)

  return NextResponse.json({
    success: true,
    all_done: true,
    token_earned: true,
    new_token_count: newTokenCount,
  })
}
