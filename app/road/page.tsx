import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { RoadPageClient } from '@/components/road/road-page-client'
import type { RoadSummary } from '@/components/road/road-page-client'

export const metadata: Metadata = {
  title: 'Roads | Jnana Sethu',
  description: 'Choose your learning path. Work through curated components to build real skills.',
}

export default async function RoadPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: userData } = await supabase
    .from('users')
    .select('university_id, today_time_minutes, today_date')
    .eq('id', user.id)
    .single()

  const universityId = userData?.university_id ?? null

  // Compute today's study minutes (reset if date has changed)
  const today = new Date().toISOString().split('T')[0]
  const todayMinutes =
    userData?.today_date === today ? (userData?.today_time_minutes ?? 0) : 0

  // Fetch all accessible roads
  const orParts = [
    `and(type.eq.preset,is_published.eq.true)`,
    `created_by.eq.${user.id}`,
  ]
  if (universityId) {
    orParts.push(`and(type.eq.university,university_id.eq.${universityId},is_published.eq.true)`)
  }

  const { data: roads } = await supabase
    .from('roads')
    .select('*')
    .or(orParts.join(','))

  if (!roads || roads.length === 0) {
    return (
      <RoadPageClient
        presetRoads={[]}
        universityRoads={[]}
        customRoads={[]}
        todayMinutes={todayMinutes}
      />
    )
  }

  const roadIds = roads.map((r: { id: string }) => r.id)

  // Fetch road_components with component durations
  const { data: roadComps } = await supabase
    .from('road_components')
    .select('road_id, component_id, components(duration_minutes)')
    .in('road_id', roadIds)

  const typedRoadComps = (roadComps ?? []) as Array<{
    road_id: string
    component_id: string
    components: { duration_minutes: number } | null
  }>

  // Fetch user's completed components for these roads
  const allCompIds = [...new Set(typedRoadComps.map(rc => rc.component_id))]
  const { data: userProgress } = allCompIds.length > 0
    ? await supabase
        .from('user_component_progress')
        .select('component_id')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .in('component_id', allCompIds)
    : { data: [] }

  const completedSet = new Set((userProgress ?? []).map((p: { component_id: string }) => p.component_id))

  // Aggregate per road
  const compsByRoad = new Map<string, typeof typedRoadComps>()
  for (const rc of typedRoadComps) {
    if (!compsByRoad.has(rc.road_id)) compsByRoad.set(rc.road_id, [])
    compsByRoad.get(rc.road_id)!.push(rc)
  }

  const enriched: RoadSummary[] = roads.map((road: Record<string, unknown>) => {
    const comps = compsByRoad.get(road.id as string) ?? []
    const totalComponents = comps.length
    const completedComponents = comps.filter(rc => completedSet.has(rc.component_id)).length
    const totalDurationMinutes = comps.reduce(
      (sum, rc) => sum + (rc.components?.duration_minutes ?? 0), 0
    )
    return {
      id: road.id as string,
      slug: road.slug as string,
      title: road.title as string,
      description: road.description as string | undefined,
      color: road.color as string,
      icon: road.icon as string,
      type: road.type as 'preset' | 'university' | 'custom',
      is_published: road.is_published as boolean,
      component_count: totalComponents,
      total_duration_minutes: totalDurationMinutes,
      completion_percent: totalComponents > 0
        ? Math.round((completedComponents / totalComponents) * 100)
        : 0,
      completed_count: completedComponents,
    }
  })

  const presetRoads = enriched.filter(r => r.type === 'preset')
  const universityRoads = enriched.filter(r => r.type === 'university')
  const customRoads = enriched.filter(r => r.type === 'custom')

  return (
    <RoadPageClient
      presetRoads={presetRoads}
      universityRoads={universityRoads}
      customRoads={customRoads}
      todayMinutes={todayMinutes}
    />
  )
}
