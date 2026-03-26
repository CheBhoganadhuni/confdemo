import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  // Fetch all active tasks and today's logs in parallel
  const today = new Date().toISOString().split('T')[0]

  const [tasksRes, logsRes, userRes] = await Promise.all([
    supabase.from('daily_tasks').select('*').eq('is_active', true),
    supabase.from('user_daily_logs')
      .select('task_id, proof_url, proof_verified')
      .eq('user_id', userId)
      .eq('completed_on', today),
    supabase.from('users').select('today_time_minutes, today_date').eq('id', userId).single(),
  ])

  const tasks = tasksRes.data ?? []
  const todayLogs = logsRes.data ?? []
  const logsMap = new Map(todayLogs.map(l => [l.task_id, l]))

  // Resolved today_time for study task
  const userTodayDate = userRes.data?.today_date
  const studyMinutesToday = userTodayDate === today
    ? (userRes.data?.today_time_minutes ?? 0)
    : 0

  // Check unlock status per task (city must be fully completed)
  async function isCityComplete(citySlug: string): Promise<boolean> {
    const { data: city } = await supabase
      .from('cities').select('id').eq('slug', citySlug).single()
    if (!city) return false

    const { data: levels } = await supabase
      .from('levels').select('id').eq('city_id', city.id).eq('is_published', true)
    const levelIds = (levels ?? []).map(l => l.id)
    if (levelIds.length === 0) return false

    const { data: levelComps } = await supabase
      .from('level_components').select('component_id').in('level_id', levelIds)
    const compIds = (levelComps ?? []).map(lc => lc.component_id)
    if (compIds.length === 0) return false

    const { count } = await supabase
      .from('user_component_progress')
      .select('component_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('component_id', compIds)

    return (count ?? 0) === compIds.length
  }

  // Resolve unlock status for each task
  const result = await Promise.all(
    tasks.map(async task => {
      let isUnlocked = true

      if (task.unlock_after_city_slug) {
        isUnlocked = await isCityComplete(task.unlock_after_city_slug)
      }

      const log = logsMap.get(task.id)

      return {
        ...task,
        is_unlocked: isUnlocked,
        is_done_today: !!log,
        proof_url: log?.proof_url ?? null,
        proof_verified: log?.proof_verified ?? false,
        study_minutes_today: task.type === 'study_time' ? studyMinutesToday : undefined,
      }
    })
  )

  return NextResponse.json(result)
}
