import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/ProfileClient'
import type {
  ProfileUser,
  ProfileTask,
  ProfileRoad,
  ProfileCompletedLevel,
  ProfileTokenEntry,
} from '@/components/profile/ProfileClient'

export const metadata = {
  title: 'Profile | Jnana Sethu',
  description: 'Your player card and learning progress on Jnana Sethu.',
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/')

  const today = new Date().toISOString().split('T')[0]

  // Parallel: user row, daily tasks, today's logs
  const [userRes, tasksRes, logsRes] = await Promise.all([
    supabase
      .from('users')
      .select('*, university:universities(name), department:departments(name)')
      .eq('id', authUser.id)
      .single(),
    supabase.from('daily_tasks').select('*').eq('is_active', true),
    supabase
      .from('user_daily_logs')
      .select('task_id, proof_url, proof_verified')
      .eq('user_id', authUser.id)
      .eq('completed_on', today),
  ])

  const userData = userRes.data
  if (!userData) redirect('/')

  // Today's study minutes (reset if date changed)
  const todayMinutes =
    userData.today_date === today ? (userData.today_time_minutes ?? 0) : 0

  // Build ProfileUser
  const profileUser: ProfileUser = {
    name: userData.name,
    email: userData.email,
    university_name: (userData.university as { name?: string } | null)?.name ?? '',
    department_name: (userData.department as { name?: string } | null)?.name ?? '',
    year: userData.year,
    token_count: userData.token_count ?? 0,
    xp_points: userData.xp_points ?? 0,
    today_minutes: todayMinutes,
    github_username: (userData as { github_username?: string | null }).github_username ?? null,
  }

  // === DAILY TASKS ===
  const allTasks = tasksRes.data ?? []
  const logsMap = new Map(
    (logsRes.data ?? []).map((l: { task_id: string; proof_url?: string }) => [l.task_id, l])
  )

  // Check unlock status for tasks that need a city completed
  async function isCityComplete(citySlug: string): Promise<boolean> {
    const { data: city } = await supabase
      .from('cities').select('id').eq('slug', citySlug).single()
    if (!city) return false

    const { data: levels } = await supabase
      .from('levels').select('id').eq('city_id', city.id).eq('is_published', true)
    const levelIds = (levels ?? []).map((l: { id: string }) => l.id)
    if (levelIds.length === 0) return false

    const { data: levelComps } = await supabase
      .from('level_components').select('component_id').in('level_id', levelIds)
    const compIds = (levelComps ?? []).map((lc: { component_id: string }) => lc.component_id)
    if (compIds.length === 0) return false

    const { count } = await supabase
      .from('user_component_progress')
      .select('component_id', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .eq('status', 'completed')
      .in('component_id', compIds)

    return (count ?? 0) === compIds.length
  }

  const profileTasks: ProfileTask[] = await Promise.all(
    allTasks.map(async (task: Record<string, unknown>) => {
      let isUnlocked = true
      if (task.unlock_after_city_slug) {
        isUnlocked = await isCityComplete(task.unlock_after_city_slug as string)
      }
      const log = logsMap.get(task.id as string)
      return {
        id: task.id as string,
        type: task.type as ProfileTask['type'],
        title: task.title as string,
        description: task.description as string | undefined,
        is_done_today: !!log,
        is_unlocked: isUnlocked,
        unlock_after_city_slug: task.unlock_after_city_slug as string | undefined,
        study_minutes_today: task.type === 'study_time' ? todayMinutes : undefined,
      }
    })
  )

  // === CYCLE ENDS IN ===
  const cycleStart = userData.current_cycle_start
    ? new Date(userData.current_cycle_start)
    : null
  const now = new Date()
  let cycleEndsIn = { hours: 0, minutes: 0 }
  if (cycleStart && cycleStart > now) {
    const diffMs = cycleStart.getTime() - now.getTime()
    cycleEndsIn = {
      hours: Math.floor(diffMs / (1000 * 60 * 60)),
      minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
    }
  }

  // === ROAD PROGRESS ===
  const { data: activeRoadRows } = await supabase
    .from('user_active_roads')
    .select('road_id')
    .eq('user_id', authUser.id)

  const activeRoadIds = (activeRoadRows ?? []).map((r: { road_id: string }) => r.road_id)

  let profileRoads: ProfileRoad[] = []
  if (activeRoadIds.length > 0) {
    const { data: roads } = await supabase
      .from('roads')
      .select('id, slug, title, color, icon')
      .in('id', activeRoadIds)

    const { data: roadComps } = await supabase
      .from('road_components')
      .select('road_id, component_id')
      .in('road_id', activeRoadIds)

    const roadCompList = (roadComps ?? []) as Array<{ road_id: string; component_id: string }>
    const allRoadCompIds = roadCompList.map(rc => rc.component_id)

    const { data: userRoadProgress } = allRoadCompIds.length > 0
      ? await supabase
          .from('user_component_progress')
          .select('component_id')
          .eq('user_id', authUser.id)
          .eq('status', 'completed')
          .in('component_id', allRoadCompIds)
      : { data: [] }

    const roadCompletedSet = new Set(
      (userRoadProgress ?? []).map((p: { component_id: string }) => p.component_id)
    )

    const compsByRoad = new Map<string, string[]>()
    for (const rc of roadCompList) {
      if (!compsByRoad.has(rc.road_id)) compsByRoad.set(rc.road_id, [])
      compsByRoad.get(rc.road_id)!.push(rc.component_id)
    }

    profileRoads = (roads ?? []).map((road: Record<string, unknown>) => {
      const comps = compsByRoad.get(road.id as string) ?? []
      const total = comps.length
      const completed = comps.filter(id => roadCompletedSet.has(id)).length
      return {
        id: road.id as string,
        title: road.title as string,
        slug: road.slug as string,
        color: road.color as string,
        icon: road.icon as string,
        completion_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        completed_count: completed,
        total_count: total,
      }
    })
  }

  // === SKILLS (completed levels) ===
  const { data: allLevels } = await supabase
    .from('levels')
    .select('id, slug, title, icon, color, city_id')
    .eq('is_published', true)

  const levelIds = (allLevels ?? []).map((l: { id: string }) => l.id)

  const { data: levelComps } = levelIds.length > 0
    ? await supabase
        .from('level_components')
        .select('level_id, component_id')
        .in('level_id', levelIds)
    : { data: [] }

  const { data: userCompProgress } = await supabase
    .from('user_component_progress')
    .select('component_id, completed_at')
    .eq('user_id', authUser.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  const completedCompIds = new Set(
    (userCompProgress ?? []).map((p: { component_id: string }) => p.component_id)
  )

  // Group level_components by level
  const compsByLevel = new Map<string, string[]>()
  for (const lc of (levelComps ?? []) as Array<{ level_id: string; component_id: string }>) {
    if (!compsByLevel.has(lc.level_id)) compsByLevel.set(lc.level_id, [])
    compsByLevel.get(lc.level_id)!.push(lc.component_id)
  }

  // Fetch cities for coloring
  const { data: allCities } = await supabase
    .from('cities')
    .select('id, title, color')
    .eq('is_published', true)

  const cityMap = new Map(
    (allCities ?? []).map((c: { id: string; title: string; color: string }) => [c.id, c])
  )

  // Build completed levels (where user has any progress)
  const completedLevels: ProfileCompletedLevel[] = []
  for (const level of (allLevels ?? []) as Array<{
    id: string; slug: string; title: string; icon?: string; color?: string; city_id: string
  }>) {
    const comps = compsByLevel.get(level.id) ?? []
    if (comps.length === 0) continue
    const doneCount = comps.filter(id => completedCompIds.has(id)).length
    if (doneCount === 0) continue

    const city = cityMap.get(level.city_id)
    completedLevels.push({
      id: level.id,
      slug: level.slug,
      title: level.title,
      icon: level.icon ?? 'BookOpen',
      color: level.color ?? '#F97316',
      city_id: level.city_id,
      city_title: city?.title ?? level.city_id,
      city_color: city?.color ?? '#F97316',
      completion_percent: Math.round((doneCount / comps.length) * 100),
      completed_count: doneCount,
      total_count: comps.length,
    })
  }

  // === TOKEN HISTORY (recent component completions) ===
  const { data: recentProgress } = await supabase
    .from('user_component_progress')
    .select('component_id, completed_at, components(title)')
    .eq('user_id', authUser.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(10)

  const tokenHistory: ProfileTokenEntry[] = (recentProgress ?? []).map(
    (p: { component_id: string; completed_at: string | null; components: { title?: string } | null }) => ({
      id: p.component_id,
      date: p.completed_at ?? today,
      event: p.components?.title ?? 'Component completed',
    })
  )

  return (
    <ProfileClient
      user={profileUser}
      tasks={profileTasks}
      cycleEndsIn={cycleEndsIn}
      roads={profileRoads}
      completedLevels={completedLevels}
      tokenHistory={tokenHistory}
    />
  )
}
