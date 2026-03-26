import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const { slug } = await params

  const { data: road, error } = await supabase
    .from('roads')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !road) {
    return NextResponse.json({ error: 'Road not found' }, { status: 404 })
  }

  // Get ordered road components with component details
  const { data: roadComps } = await supabase
    .from('road_components')
    .select('component_id, sequence_order')
    .eq('road_id', road.id)
    .order('sequence_order')

  const componentIds = (roadComps ?? []).map(rc => rc.component_id)

  if (componentIds.length === 0) {
    return NextResponse.json({
      ...road,
      components: [],
      completion_percent: 0,
      completed_count: 0,
      total_count: 0,
    })
  }

  const [componentsRes, progressRes] = await Promise.all([
    supabase.from('components')
      .select('*, resources(*)')
      .in('id', componentIds)
      .eq('is_published', true),
    supabase.from('user_component_progress')
      .select('component_id, status, completed_at')
      .eq('user_id', userId)
      .in('component_id', componentIds),
  ])

  const progressMap = new Map(
    (progressRes.data ?? []).map(p => [p.component_id, p])
  )
  const orderMap = new Map((roadComps ?? []).map(rc => [rc.component_id, rc.sequence_order]))

  const components = (componentsRes.data ?? [])
    .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
    .map(comp => {
      const prog = progressMap.get(comp.id)
      return {
        ...comp,
        progress_status: prog?.status ?? null,
        completed_at: prog?.completed_at ?? null,
      }
    })

  const completedCount = components.filter(c => c.progress_status === 'completed').length

  return NextResponse.json({
    ...road,
    components,
    completion_percent: components.length > 0
      ? Math.round((completedCount / components.length) * 100)
      : 0,
    completed_count: completedCount,
    total_count: components.length,
  })
}
