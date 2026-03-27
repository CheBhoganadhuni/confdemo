import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoadBuilderClient } from '@/components/road/road-builder-client'
import type { BuilderCity, BuilderComponent } from '@/app/road/build/page'

export default async function RoadEditPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Fetch the road being edited
  const { data: road } = await supabase
    .from('roads')
    .select('id, slug, title, description, color, is_published, created_by')
    .eq('slug', slug)
    .single()

  if (!road || road.created_by !== user.id) redirect('/road')

  // Fetch current road_components ordered
  const { data: roadComps } = await supabase
    .from('road_components')
    .select('component_id, sequence_order')
    .eq('road_id', road.id)
    .order('sequence_order')

  // --- same city/component fetch as build page ---
  const { data: rawCities } = await supabase
    .from('cities')
    .select('id, slug, title, color, icon')
    .eq('is_published', true)
    .order('created_at')

  const cityIds = (rawCities ?? []).map((c: { id: string }) => c.id)

  const { data: rawLevels } = cityIds.length > 0
    ? await supabase
        .from('levels')
        .select('id, title, city_id, sequence_order')
        .eq('is_published', true)
        .in('city_id', cityIds)
        .order('sequence_order')
    : { data: [] }

  const levelIds = (rawLevels ?? []).map((l: { id: string }) => l.id)

  const { data: levelComps } = levelIds.length > 0
    ? await supabase
        .from('level_components')
        .select('level_id, component_id, sequence_order, components(id, title, duration_minutes, is_published)')
        .in('level_id', levelIds)
        .order('sequence_order')
    : { data: [] }

  const typedLevelComps = (levelComps ?? []) as Array<{
    level_id: string
    component_id: string
    sequence_order: number
    components: { id: string; title: string; duration_minutes: number; is_published: boolean } | null
  }>

  // Build city/component maps
  const cityMap = new Map(
    (rawCities ?? []).map((c: { id: string; title: string; color: string; icon: string }) => [c.id, c])
  )
  const levelMap = new Map(
    (rawLevels ?? []).map((l: { id: string; title: string; city_id: string }) => [l.id, l])
  )

  const compsByCity = new Map<string, BuilderComponent[]>()
  const seenComponentIds = new Set<string>()
  const allComponentsById = new Map<string, BuilderComponent>()

  for (const lc of typedLevelComps) {
    const comp = lc.components
    if (!comp || !comp.is_published) continue
    if (seenComponentIds.has(comp.id)) continue
    seenComponentIds.add(comp.id)

    const level = levelMap.get(lc.level_id)
    if (!level) continue
    const city = cityMap.get(level.city_id)
    if (!city) continue

    const builderComp: BuilderComponent = {
      id: comp.id,
      name: comp.title,
      cityId: level.city_id,
      cityName: (city as { title: string }).title,
      cityColor: (city as { color: string }).color,
      levelId: lc.level_id,
      levelName: level.title,
      estimatedMinutes: comp.duration_minutes ?? 30,
    }

    if (!compsByCity.has(level.city_id)) compsByCity.set(level.city_id, [])
    compsByCity.get(level.city_id)!.push(builderComp)
    allComponentsById.set(comp.id, builderComp)
  }

  const cities: BuilderCity[] = (rawCities ?? [])
    .map((city: { id: string; title: string; color: string; icon: string }) => ({
      id: city.id,
      name: city.title,
      color: city.color,
      icon: city.icon,
      components: compsByCity.get(city.id) ?? [],
    }))
    .filter((city: BuilderCity) => city.components.length > 0)

  // Build initial selected components in order
  const initialComponents: BuilderComponent[] = (roadComps ?? [])
    .sort((a, b) => a.sequence_order - b.sequence_order)
    .map(rc => allComponentsById.get(rc.component_id))
    .filter(Boolean) as BuilderComponent[]

  // Count user's custom roads (for limit display)
  const { count: userRoadCount } = await supabase
    .from('roads')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .eq('type', 'custom')

  const { data: opsUser } = await supabase
    .from('users')
    .select('road_ops')
    .eq('id', user.id)
    .single()

  const hasUsedDailyOp = (opsUser?.road_ops ?? 0) >= 1

  return (
    <RoadBuilderClient
      cities={cities}
      userRoadCount={userRoadCount ?? 0}
      maxRoads={3}
      hasUsedDailyOp={hasUsedDailyOp}
      editMode={{
        slug: road.slug,
        initialName: road.title,
        initialDescription: road.description ?? '',
        initialColor: road.color,
        initialPublished: road.is_published ?? false,
        initialComponents,
      }}
    />
  )
}
