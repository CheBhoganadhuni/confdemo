import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoadBuilderClient } from '@/components/road/road-builder-client'

export interface BuilderComponent {
  id: string
  name: string
  cityId: string
  cityName: string
  cityColor: string
  levelId: string
  levelName: string
  estimatedMinutes: number
}

export interface BuilderCity {
  id: string
  name: string
  color: string
  icon: string
  components: BuilderComponent[]
}

export default async function RoadBuildPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Fetch all published cities
  const { data: rawCities } = await supabase
    .from('cities')
    .select('id, slug, title, color, icon')
    .eq('is_published', true)
    .order('created_at')

  const cityIds = (rawCities ?? []).map((c: { id: string }) => c.id)

  // Fetch published levels for those cities
  const { data: rawLevels } = cityIds.length > 0
    ? await supabase
        .from('levels')
        .select('id, title, city_id, sequence_order')
        .eq('is_published', true)
        .in('city_id', cityIds)
        .order('sequence_order')
    : { data: [] }

  const levelIds = (rawLevels ?? []).map((l: { id: string }) => l.id)

  // Fetch level_components with component details
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

  // Count user's existing custom roads
  const { count: userRoadCount } = await supabase
    .from('roads')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', user.id)
    .eq('type', 'custom')

  // Build lookup maps
  const cityMap = new Map(
    (rawCities ?? []).map((c: { id: string; title: string; color: string; icon: string }) => [c.id, c])
  )
  const levelMap = new Map(
    (rawLevels ?? []).map((l: { id: string; title: string; city_id: string }) => [l.id, l])
  )

  // Group components by city
  const compsByCity = new Map<string, BuilderComponent[]>()
  const seenComponentIds = new Set<string>()

  for (const lc of typedLevelComps) {
    const comp = lc.components
    if (!comp || !comp.is_published) continue
    if (seenComponentIds.has(comp.id)) continue
    seenComponentIds.add(comp.id)

    const level = levelMap.get(lc.level_id)
    if (!level) continue

    const city = cityMap.get(level.city_id)
    if (!city) continue

    if (!compsByCity.has(level.city_id)) compsByCity.set(level.city_id, [])
    compsByCity.get(level.city_id)!.push({
      id: comp.id,
      name: comp.title,
      cityId: level.city_id,
      cityName: (city as { title: string }).title,
      cityColor: (city as { color: string }).color,
      levelId: lc.level_id,
      levelName: level.title,
      estimatedMinutes: comp.duration_minutes ?? 30,
    })
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

  return (
    <RoadBuilderClient
      cities={cities}
      userRoadCount={userRoadCount ?? 0}
      maxRoads={3}
    />
  )
}
