import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  // Fetch cities, levels, and user's university in parallel
  const [citiesRes, levelsRes, userRes] = await Promise.all([
    supabase.from('cities').select('*').eq('is_published', true).order('created_at'),
    supabase.from('levels').select('id, city_id, slug, title, sequence_order, difficulty, is_checkpoint, is_published, estimated_hours')
      .eq('is_published', true).order('sequence_order'),
    supabase.from('users').select('university_id').eq('id', userId).single(),
  ])

  const cities = citiesRes.data ?? []
  const levels = levelsRes.data ?? []
  const universityId = userRes.data?.university_id ?? null

  if (cities.length === 0) return NextResponse.json([])

  const levelIds = levels.map(l => l.id)

  // Get all level→component mappings
  const { data: levelComps } = levelIds.length > 0
    ? await supabase.from('level_components').select('component_id, level_id').in('level_id', levelIds)
    : { data: [] }

  const allCompIds = [...new Set((levelComps ?? []).map(lc => lc.component_id))]

  // Get user's completed components
  const { data: userProgress } = allCompIds.length > 0
    ? await supabase.from('user_component_progress')
        .select('component_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('component_id', allCompIds)
    : { data: [] }

  const completedSet = new Set((userProgress ?? []).map(p => p.component_id))

  // Active students (same university, last 7 days, excluding self)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  let activeStudentsByCity = new Map<string, Set<string>>()

  if (universityId && allCompIds.length > 0) {
    // Get sibling student ids first, then their recent progress
    const { data: siblingUsers } = await supabase
      .from('users').select('id').eq('university_id', universityId).neq('id', userId)

    const siblingIds = (siblingUsers ?? []).map(u => u.id)

    if (siblingIds.length > 0) {
      const { data: activeProgress } = await supabase
        .from('user_component_progress')
        .select('user_id, component_id')
        .in('component_id', allCompIds)
        .in('user_id', siblingIds)
        .gte('completed_at', sevenDaysAgo)

      // Build componentId → cityId map
      const compToCity = new Map<string, string>()
      for (const lc of levelComps ?? []) {
        const level = levels.find(l => l.id === lc.level_id)
        if (level) compToCity.set(lc.component_id, level.city_id)
      }

      for (const prog of activeProgress ?? []) {
        const cityId = compToCity.get(prog.component_id)
        if (!cityId) continue
        if (!activeStudentsByCity.has(cityId)) activeStudentsByCity.set(cityId, new Set())
        activeStudentsByCity.get(cityId)!.add(prog.user_id)
      }
    }
  }

  // Group levels and components by city
  const levelsByCity = new Map<string, typeof levels>()
  for (const level of levels) {
    if (!levelsByCity.has(level.city_id)) levelsByCity.set(level.city_id, [])
    levelsByCity.get(level.city_id)!.push(level)
  }

  const compsByLevel = new Map<string, string[]>()
  for (const lc of levelComps ?? []) {
    if (!compsByLevel.has(lc.level_id)) compsByLevel.set(lc.level_id, [])
    compsByLevel.get(lc.level_id)!.push(lc.component_id)
  }

  // Build CityWithProgress[]
  const result = cities.map(city => {
    const cityLevels = levelsByCity.get(city.id) ?? []

    let totalComponents = 0
    let completedComponents = 0

    for (const level of cityLevels) {
      const comps = compsByLevel.get(level.id) ?? []
      totalComponents += comps.length
      completedComponents += comps.filter(cid => completedSet.has(cid)).length
    }

    const completionPercent = totalComponents > 0
      ? Math.round((completedComponents / totalComponents) * 100)
      : 0

    const completedLevels = cityLevels.filter(level => {
      const comps = compsByLevel.get(level.id) ?? []
      return comps.length > 0 && comps.every(cid => completedSet.has(cid))
    }).length

    return {
      ...city,
      levels: cityLevels,
      completion_percent: completionPercent,
      completed_levels: completedLevels,
      total_levels: cityLevels.length,
      active_student_count: activeStudentsByCity.get(city.id)?.size ?? 0,
    }
  })

  return NextResponse.json(result)
}
