import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  // Get user's university
  const { data: user } = await supabase
    .from('users')
    .select('university_id')
    .eq('id', userId)
    .single()

  const universityId = user?.university_id ?? null

  // Build filter: presets + university roads + user's roads
  let query = supabase.from('roads').select('*')

  // We need: (type='preset' AND is_published) OR (type='university' AND university_id=X AND is_published) OR (created_by=userId)
  const orParts = [
    `and(type.eq.preset,is_published.eq.true)`,
    `created_by.eq.${userId}`,
  ]
  if (universityId) {
    orParts.push(`and(type.eq.university,university_id.eq.${universityId},is_published.eq.true)`)
  }

  const { data: roads, error } = await query.or(orParts.join(','))
  if (error) return NextResponse.json({ error: 'Failed to fetch roads' }, { status: 500 })

  if (!roads || roads.length === 0) return NextResponse.json([])

  const roadIds = roads.map(r => r.id)

  // Get component counts per road + total durations
  const { data: roadComps } = await supabase
    .from('road_components')
    .select('road_id, component_id, sequence_order, components(duration_minutes)')
    .in('road_id', roadIds)

  // Get user's progress for all components across these roads
  const allCompIds = [...new Set((roadComps ?? []).map(rc => rc.component_id))]
  const { data: userProgress } = allCompIds.length > 0
    ? await supabase.from('user_component_progress')
        .select('component_id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('component_id', allCompIds)
    : { data: [] }

  const completedSet = new Set((userProgress ?? []).map(p => p.component_id))

  // Aggregate per road
  const compsByRoad = new Map<string, typeof roadComps>()
  for (const rc of roadComps ?? []) {
    if (!compsByRoad.has(rc.road_id)) compsByRoad.set(rc.road_id, [])
    compsByRoad.get(rc.road_id)!.push(rc)
  }

  const result = roads.map(road => {
    const comps = compsByRoad.get(road.id) ?? []
    const totalComponents = comps.length
    const completedComponents = comps.filter(rc => completedSet.has(rc.component_id)).length
    const totalDurationMinutes = comps.reduce(
      (sum, rc) => sum + ((rc as any).components?.duration_minutes ?? 0), 0
    )
    const completionPercent = totalComponents > 0
      ? Math.round((completedComponents / totalComponents) * 100)
      : 0

    return {
      ...road,
      component_count: totalComponents,
      total_duration_minutes: totalDurationMinutes,
      completion_percent: completionPercent,
      completed_count: completedComponents,
    }
  })

  return NextResponse.json(result)
}
