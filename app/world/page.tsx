import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorldMapClient } from '@/components/world/world-map-client'
import type { CityWithProgress, LevelWithProgress } from '@/lib/types/database'

export const metadata = {
  title: 'World Map | Jnana Sethu',
  description: 'Explore the learning landscape. Navigate through cities, levels, and components.',
}

export default async function WorldPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: userData } = await supabase
    .from('users')
    .select('university_id, name, token_count, today_time_minutes')
    .eq('id', user.id)
    .single()

  // Fetch all published cities
  const { data: rawCities } = await supabase
    .from('cities')
    .select('*')
    .eq('is_published', true)
    .order('created_at')

  const ud = userData as { name?: string; token_count?: number; today_time_minutes?: number } | null
  const userName = ud?.name ?? undefined
  const tokenCount = ud?.token_count ?? 0
  const todayMinutes = ud?.today_time_minutes ?? 0

  if (!rawCities || rawCities.length === 0) {
    return <WorldMapClient cities={[]} userId={user.id} universityId={userData?.university_id ?? undefined} userName={userName} tokenCount={tokenCount} todayMinutes={todayMinutes} />
  }

  const cityIds = rawCities.map((c: { id: string }) => c.id)

  // Fetch published levels for all cities
  const { data: rawLevels } = await supabase
    .from('levels')
    .select('*')
    .eq('is_published', true)
    .in('city_id', cityIds)
    .order('sequence_order')

  const levelIds = (rawLevels ?? []).map((l: { id: string }) => l.id)

  // Fetch level_components with component durations in one query
  const levelCompsRes = levelIds.length > 0
    ? await supabase
        .from('level_components')
        .select('level_id, component_id, components(duration_minutes)')
        .in('level_id', levelIds)
    : { data: [] }

  const levelComps = (levelCompsRes.data ?? []) as Array<{
    level_id: string
    component_id: string
    components: { duration_minutes: number } | null
  }>

  // Build component_id → city_id map (for active student counting later)
  const levelIdToCityId: Record<string, string> = {}
  for (const level of (rawLevels ?? [])) {
    levelIdToCityId[level.id] = level.city_id
  }
  const compIdToCityId: Record<string, string> = {}
  for (const lc of levelComps) {
    const cityId = levelIdToCityId[lc.level_id]
    if (cityId) compIdToCityId[lc.component_id] = cityId
  }
  const allCompIds = Object.keys(compIdToCityId)

  // Fetch user's completed components
  const { data: userProgress } = await supabase
    .from('user_component_progress')
    .select('component_id')
    .eq('user_id', user.id)
    .eq('status', 'completed')

  const completedCompIds = new Set((userProgress ?? []).map((p: { component_id: string }) => p.component_id))

  // Fetch active students in last 7 days (batch — one query total)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentActivity } = allCompIds.length > 0
    ? await supabase
        .from('user_component_progress')
        .select('user_id, component_id')
        .in('component_id', allCompIds)
        .eq('status', 'completed')
        .gte('completed_at', sevenDaysAgo)
        .neq('user_id', user.id)
    : { data: [] }

  // Build city_id → Set<user_id> for active count
  const cityActiveUsers: Record<string, Set<string>> = {}
  for (const row of (recentActivity ?? []) as Array<{ user_id: string; component_id: string }>) {
    const cityId = compIdToCityId[row.component_id]
    if (!cityId) continue
    if (!cityActiveUsers[cityId]) cityActiveUsers[cityId] = new Set()
    cityActiveUsers[cityId].add(row.user_id)
  }

  // Build component map per level
  const compsByLevel = new Map<string, Array<{ component_id: string; duration_minutes: number }>>()
  for (const lc of levelComps) {
    if (!compsByLevel.has(lc.level_id)) compsByLevel.set(lc.level_id, [])
    compsByLevel.get(lc.level_id)!.push({
      component_id: lc.component_id,
      duration_minutes: lc.components?.duration_minutes ?? 30,
    })
  }

  // Build LevelWithProgress for each level
  const levelsByCity = new Map<string, LevelWithProgress[]>()
  for (const level of (rawLevels ?? [])) {
    const comps = compsByLevel.get(level.id) ?? []
    const totalCount = comps.length
    const completedCount = comps.filter(c => completedCompIds.has(c.component_id)).length
    const totalMinutes = comps.reduce((sum, c) => sum + c.duration_minutes, 0)
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
    const remainingMinutes = comps
      .filter(c => !completedCompIds.has(c.component_id))
      .reduce((sum, c) => sum + c.duration_minutes, 0)

    const levelWithProgress: LevelWithProgress = {
      ...level,
      components: [],
      completion_percent: completionPercent,
      completed_count: completedCount,
      total_count: totalCount,
      estimated_hours: Math.round((totalMinutes / 60) * 10) / 10,
      estimated_hours_remaining: Math.round((remainingMinutes / 60) * 10) / 10,
    }

    if (!levelsByCity.has(level.city_id)) levelsByCity.set(level.city_id, [])
    levelsByCity.get(level.city_id)!.push(levelWithProgress)
  }

  // Build CityWithProgress
  const cities: CityWithProgress[] = rawCities.map((city: Record<string, unknown>) => {
    const levels = levelsByCity.get(city.id as string) ?? []
    const totalLevels = levels.length
    const completedLevels = levels.filter(l => l.completion_percent === 100).length
    const completionPercent = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0

    return {
      ...city,
      levels,
      completion_percent: completionPercent,
      completed_levels: completedLevels,
      total_levels: totalLevels,
      active_student_count: cityActiveUsers[city.id as string]?.size ?? 0,
    } as CityWithProgress
  })

  return (
    <WorldMapClient
      cities={cities}
      userId={user.id}
      universityId={userData?.university_id ?? undefined}
      userName={userName}
      tokenCount={tokenCount}
      todayMinutes={todayMinutes}
    />
  )
}
