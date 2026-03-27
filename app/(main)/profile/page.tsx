import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/ProfileClient'
import type {
  ProfileUser,
  ProfileTask,
  BoltSummary,
  ProfileRoad,
  ProfileCompletedLevel,
  ProfileTokenEntry,
} from '@/components/profile/ProfileClient'

export const metadata = {
  title: 'Profile | Jnana Sethu',
  description: 'Your player card and learning progress on Jnana Sethu.',
}

function slugToTitle(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/')

  const today = new Date().toISOString().split('T')[0]

  // Ensure bolt_status row exists for this user
  await supabase
    .from('bolt_status')
    .upsert({ user_id: authUser.id }, { onConflict: 'user_id', ignoreDuplicates: true })

  // Parallel: user row, daily tasks, bolt_status
  const [userRes, tasksRes, boltRes] = await Promise.all([
    supabase
      .from('users')
      .select('*, university:universities(name), department:departments(name)')
      .eq('id', authUser.id)
      .single(),
    supabase.from('daily_tasks').select('*').eq('is_active', true),
    supabase.from('bolt_status').select('*').eq('user_id', authUser.id).single(),
  ])

  const userData = userRes.data
  if (!userData) redirect('/')

  const bolt = boltRes.data ?? { study: false, dsa: false, github: false, linkedin: false, token_sent: false }

  // Today's study minutes
  const todayMinutes = userData.today_date === today ? (userData.today_time_minutes ?? 0) : 0

  // Auto-apply study bolt if 120 min reached
  const studyDone = todayMinutes >= 120 || bolt.study === true

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
    github_id: (userData as { github_id?: string | null }).github_id ?? null,
    linkedin_id: (userData as { linkedin_id?: string | null }).linkedin_id ?? null,
  }

  // ── Check city fully completed ───────────────────────────────────────────
  async function isCityComplete(citySlug: string): Promise<boolean> {
    const { data: city } = await supabase
      .from('cities').select('id').eq('slug', citySlug).single()
    if (!city) return false

    const { data: levels } = await supabase
      .from('levels').select('id').eq('city_id', city.id).eq('is_published', true)
    const levelIds = (levels ?? []).map((l: { id: string }) => l.id)
    if (!levelIds.length) return false

    const { data: levelComps } = await supabase
      .from('level_components').select('component_id').in('level_id', levelIds)
    const compIds = (levelComps ?? []).map((lc: { component_id: string }) => lc.component_id)
    if (!compIds.length) return false

    const { count } = await supabase
      .from('user_component_progress')
      .select('component_id', { count: 'exact', head: true })
      .eq('user_id', authUser.id).eq('status', 'completed').in('component_id', compIds)

    return (count ?? 0) === compIds.length
  }

  // ── Build tasks with is_done from bolt_status ────────────────────────────
  const allTasks = tasksRes.data ?? []

  const profileTasks: ProfileTask[] = await Promise.all(
    allTasks.map(async (task: Record<string, unknown>) => {
      let isUnlocked = true
      let unlockReason: string | undefined

      if (task.unlock_after_city_slug) {
        const cityDone = await isCityComplete(task.unlock_after_city_slug as string)
        if (!cityDone) {
          isUnlocked = false
          unlockReason = `Complete ${slugToTitle(task.unlock_after_city_slug as string)} city first`
        } else if (task.type === 'github' && !profileUser.github_id) {
          isUnlocked = false
          unlockReason = 'Connect your GitHub account to unlock this task'
        } else if (task.type === 'linkedin' && !profileUser.linkedin_id) {
          isUnlocked = false
          unlockReason = 'Connect your LinkedIn account to unlock this task'
        }
      }

      // is_done comes from bolt_status columns
      const type = task.type as ProfileTask['type']
      const isDone =
        type === 'study_time' ? studyDone
        : type === 'dsa' ? bolt.dsa === true
        : type === 'github' ? bolt.github === true
        : type === 'linkedin' ? bolt.linkedin === true
        : false

      return {
        id: task.id as string,
        type,
        title: task.title as string,
        description: task.description as string | undefined,
        is_done: isDone,
        is_unlocked: isUnlocked,
        unlock_reason: unlockReason ?? null,
        unlock_after_city_slug: task.unlock_after_city_slug as string | undefined,
        study_minutes_today: type === 'study_time' ? todayMinutes : undefined,
      }
    })
  )

  // ── Build bolt_summary ───────────────────────────────────────────────────
  // A task is required for bolt collection when its city is complete.
  // Account-connection-locked tasks (unlock_reason starts with "Connect") still count —
  // the user must connect their account AND complete the task before collecting.
  const taskTypeToBoltCol: Record<string, keyof typeof bolt> = {
    study_time: 'study', dsa: 'dsa', github: 'github', linkedin: 'linkedin',
  }
  const requiredForBolt = profileTasks.filter(t =>
    t.is_unlocked || t.unlock_reason?.startsWith('Connect')
  )
  const allUnlockedDone =
    requiredForBolt.length > 0 &&
    requiredForBolt.every(t => {
      const col = taskTypeToBoltCol[t.type]
      return col ? bolt[col] === true : false
    })

  const boltSummary: BoltSummary = {
    // Use actual DB value — NOT studyDone. This way boltSummary.study stays false
    // until the user explicitly clicks "Mark Complete", even if minutes >= 60.
    // The ProfileClient button condition is: task.is_done && !boltSummary.study
    study: bolt.study === true,
    dsa: bolt.dsa === true,
    github: bolt.github === true,
    linkedin: bolt.linkedin === true,
    token_sent: bolt.token_sent === true,
    all_unlocked_done: allUnlockedDone,
  }

  // ── Road progress ────────────────────────────────────────────────────────
  const { data: activeRoadRows } = await supabase
    .from('user_active_roads').select('road_id').eq('user_id', authUser.id)

  const activeRoadIds = (activeRoadRows ?? []).map((r: { road_id: string }) => r.road_id)
  let profileRoads: ProfileRoad[] = []

  if (activeRoadIds.length > 0) {
    const { data: roads } = await supabase
      .from('roads').select('id, slug, title, color, icon').in('id', activeRoadIds)
    const { data: roadComps } = await supabase
      .from('road_components').select('road_id, component_id').in('road_id', activeRoadIds)

    const roadCompList = (roadComps ?? []) as Array<{ road_id: string; component_id: string }>
    const allRoadCompIds = roadCompList.map(rc => rc.component_id)

    const { data: userRoadProgress } = allRoadCompIds.length > 0
      ? await supabase.from('user_component_progress').select('component_id')
          .eq('user_id', authUser.id).eq('status', 'completed').in('component_id', allRoadCompIds)
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
      const completed = comps.filter(id => roadCompletedSet.has(id)).length
      return {
        id: road.id as string,
        title: road.title as string,
        slug: road.slug as string,
        color: road.color as string,
        icon: road.icon as string,
        completion_percent: comps.length > 0 ? Math.round((completed / comps.length) * 100) : 0,
        completed_count: completed,
        total_count: comps.length,
      }
    })
  }

  // ── Skills (levels with any progress) ───────────────────────────────────
  const { data: allLevels } = await supabase
    .from('levels').select('id, slug, title, icon, color, city_id').eq('is_published', true)

  const levelIds = (allLevels ?? []).map((l: { id: string }) => l.id)
  const { data: levelComps } = levelIds.length > 0
    ? await supabase.from('level_components').select('level_id, component_id').in('level_id', levelIds)
    : { data: [] }

  const { data: userCompProgress } = await supabase
    .from('user_component_progress').select('component_id, completed_at')
    .eq('user_id', authUser.id).eq('status', 'completed').order('completed_at', { ascending: false })

  const completedCompIds = new Set(
    (userCompProgress ?? []).map((p: { component_id: string }) => p.component_id)
  )
  const compsByLevel = new Map<string, string[]>()
  for (const lc of (levelComps ?? []) as Array<{ level_id: string; component_id: string }>) {
    if (!compsByLevel.has(lc.level_id)) compsByLevel.set(lc.level_id, [])
    compsByLevel.get(lc.level_id)!.push(lc.component_id)
  }

  const { data: allCities } = await supabase
    .from('cities').select('id, title, color').eq('is_published', true)
  const cityMap = new Map(
    (allCities ?? []).map((c: { id: string; title: string; color: string }) => [c.id, c])
  )

  const completedLevels: ProfileCompletedLevel[] = []
  for (const level of (allLevels ?? []) as Array<{ id: string; slug: string; title: string; icon?: string; color?: string; city_id: string }>) {
    const comps = compsByLevel.get(level.id) ?? []
    if (!comps.length) continue
    const doneCount = comps.filter(id => completedCompIds.has(id)).length
    if (!doneCount) continue
    const city = cityMap.get(level.city_id)
    completedLevels.push({
      id: level.id, slug: level.slug, title: level.title,
      icon: level.icon ?? 'BookOpen', color: level.color ?? '#F97316',
      city_id: level.city_id,
      city_title: city?.title ?? level.city_id,
      city_color: city?.color ?? '#F97316',
      completion_percent: Math.round((doneCount / comps.length) * 100),
      completed_count: doneCount, total_count: comps.length,
    })
  }

  // ── Recent activity ──────────────────────────────────────────────────────
  const { data: recentProgress } = await supabase
    .from('user_component_progress')
    .select('component_id, completed_at, components(title)')
    .eq('user_id', authUser.id).eq('status', 'completed')
    .order('completed_at', { ascending: false }).limit(10)

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
      boltSummary={boltSummary}
      roads={profileRoads}
      completedLevels={completedLevels}
      tokenHistory={tokenHistory}
    />
  )
}
