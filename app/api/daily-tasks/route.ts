import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

type TaskType = 'github' | 'dsa' | 'linkedin' | 'study_time'

interface UnlockResult {
  unlocked: boolean
  reason?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = { from: (t: string) => any }

function slugToTitle(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function checkUnlock(
  task: { type: TaskType; unlock_after_city_slug?: string | null },
  userId: string,
  supabase: SupabaseClient,
  userRow: { github_id?: string | null; linkedin_id?: string | null }
): Promise<UnlockResult> {
  // study_time always unlocked
  if (!task.unlock_after_city_slug) return { unlocked: true }

  // Gate 1 — city fully complete
  const { data: city } = await supabase
    .from('cities').select('id').eq('slug', task.unlock_after_city_slug).single()
  if (!city) return { unlocked: false, reason: `Complete ${slugToTitle(task.unlock_after_city_slug)} to unlock` }

  const { data: levels } = await supabase
    .from('levels').select('id').eq('city_id', city.id).eq('is_published', true)
  const levelIds = (levels ?? []).map((l: { id: string }) => l.id)
  if (!levelIds.length) return { unlocked: false, reason: `Complete ${slugToTitle(task.unlock_after_city_slug)} to unlock` }

  const { data: levelComps } = await supabase
    .from('level_components').select('component_id').in('level_id', levelIds)
  const compIds = (levelComps ?? []).map((lc: { component_id: string }) => lc.component_id)
  if (!compIds.length) return { unlocked: false, reason: `Complete ${slugToTitle(task.unlock_after_city_slug)} to unlock` }

  const { count } = await supabase
    .from('user_component_progress')
    .select('component_id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('status', 'completed').in('component_id', compIds)

  if ((count ?? 0) < compIds.length) {
    return { unlocked: false, reason: `Complete ${slugToTitle(task.unlock_after_city_slug)} city first` }
  }

  // Gate 2 — account linked
  if (task.type === 'github' && !userRow.github_id) {
    return { unlocked: false, reason: 'Connect your GitHub account to unlock this task' }
  }
  if (task.type === 'linkedin' && !userRow.linkedin_id) {
    return { unlocked: false, reason: 'Connect your LinkedIn account to unlock this task' }
  }

  return { unlocked: true }
}

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth

    // Ensure bolt_status row exists for this user
    await supabase
      .from('bolt_status')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })

    // Parallel fetch: tasks, bolt_status, user row
    const [tasksRes, boltRes, userRes] = await Promise.all([
      supabase.from('daily_tasks').select('*').eq('is_active', true),
      supabase.from('bolt_status').select('*').eq('user_id', userId).single(),
      supabase
        .from('users')
        .select('today_time_minutes, today_date, github_id, linkedin_id')
        .eq('id', userId)
        .single(),
    ])

    const tasks = tasksRes.data ?? []
    const bolt = boltRes.data ?? { study: false, dsa: false, github: false, linkedin: false, token_sent: false }
    const userRow = userRes.data ?? {}

    const today = new Date().toISOString().split('T')[0]
    const studyMinutes = userRow.today_date === today ? (userRow.today_time_minutes ?? 0) : 0

    // Auto-set bolt_status.study if study time reached 60 min
    if (studyMinutes >= 60 && bolt.study === false) {
      await supabase.from('bolt_status').update({ study: true }).eq('user_id', userId)
      bolt.study = true
    }

    // Resolve unlock + done per task
    const resolvedTasks = await Promise.all(
      tasks.map(async (task: Record<string, unknown>) => {
        const { unlocked, reason } = await checkUnlock(
          { type: task.type as TaskType, unlock_after_city_slug: task.unlock_after_city_slug as string | null },
          userId,
          supabase,
          userRow as { github_id?: string | null; linkedin_id?: string | null }
        )

        // Map task type → bolt_status column
        const boltCol = task.type === 'study_time' ? 'study'
          : task.type === 'dsa' ? 'dsa'
          : task.type === 'github' ? 'github'
          : task.type === 'linkedin' ? 'linkedin'
          : null

        const isDone = boltCol
          ? (task.type === 'study_time' ? (studyMinutes >= 60 || bolt.study) : bolt[boltCol as keyof typeof bolt] === true)
          : false

        return {
          ...task,
          is_unlocked: unlocked,
          unlock_reason: reason ?? null,
          is_done: isDone,
          study_minutes_today: task.type === 'study_time' ? studyMinutes : undefined,
        }
      })
    )

    // Compute bolt_summary
    // A task counts toward bolt collection when its prerequisite CITY is complete —
    // account connection (github_id/linkedin_id) is a proof gate, not a bolt exemption.
    const taskTypeToBoltCol: Record<string, string> = {
      study_time: 'study', dsa: 'dsa', github: 'github', linkedin: 'linkedin',
    }
    const requiredForBolt = resolvedTasks.filter(t => {
      // No city gate → always required
      if (!t.unlock_after_city_slug) return true
      // City gate → required only if city is fully complete
      // We already computed is_unlocked via checkUnlock which checks city completion first.
      // But checkUnlock also fails on missing account — so we need a separate city-only check.
      // Simple approximation: task is city-complete if is_unlocked OR unlock_reason contains "Connect"
      // (meaning city is done but account isn't linked yet)
      return t.is_unlocked || (t.unlock_reason as string | null)?.startsWith('Connect')
    })
    const allUnlockedDone =
      requiredForBolt.length > 0 &&
      requiredForBolt.every(t => {
        const col = taskTypeToBoltCol[t.type as string]
        return col ? bolt[col as keyof typeof bolt] === true : false
      })

    const boltSummary = {
      study: bolt.study as boolean,
      dsa: bolt.dsa as boolean,
      github: bolt.github as boolean,
      linkedin: bolt.linkedin as boolean,
      token_sent: bolt.token_sent as boolean,
      all_unlocked_done: allUnlockedDone,
    }

    return NextResponse.json({ tasks: resolvedTasks, bolt_summary: boltSummary })
  } catch (error) {
    console.error('daily-tasks GET error:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
