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

  const { data: level, error } = await supabase
    .from('levels')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !level) {
    return NextResponse.json({ error: 'Level not found' }, { status: 404 })
  }

  // Get ordered components for this level
  const { data: levelComps } = await supabase
    .from('level_components')
    .select('component_id, sequence_order')
    .eq('level_id', level.id)
    .order('sequence_order')

  const componentIds = (levelComps ?? []).map(lc => lc.component_id)

  if (componentIds.length === 0) {
    return NextResponse.json({
      ...level,
      components: [],
      completion_percent: 0,
      completed_count: 0,
      total_count: 0,
      estimated_hours_remaining: 0,
    })
  }

  // Fetch components with their resources
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

  // Order components by sequence_order
  const orderMap = new Map((levelComps ?? []).map(lc => [lc.component_id, lc.sequence_order]))
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
  const totalCount = components.length
  const remainingMinutes = components
    .filter(c => c.progress_status !== 'completed')
    .reduce((sum, c) => sum + (c.duration_minutes ?? 0), 0)

  return NextResponse.json({
    ...level,
    components,
    completion_percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    completed_count: completedCount,
    total_count: totalCount,
    estimated_hours_remaining: Math.round((remainingMinutes / 60) * 10) / 10,
  })
}
