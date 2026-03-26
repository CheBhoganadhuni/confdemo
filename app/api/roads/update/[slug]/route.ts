import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const { slug } = await params

  const body = await req.json().catch(() => null)
  const { title, description, color, component_ids, is_published } = body ?? {}

  // Verify ownership
  const { data: road, error } = await supabase
    .from('roads')
    .select('id, created_by')
    .eq('slug', slug)
    .single()

  if (error || !road) {
    return NextResponse.json({ error: 'Road not found' }, { status: 404 })
  }

  if (road.created_by !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check daily road operation limit via users.road_ops (cron resets to 0 at midnight)
  const { data: opsUser } = await supabase
    .from('users')
    .select('road_ops')
    .eq('id', userId)
    .single()

  if ((opsUser?.road_ops ?? 0) >= 1) {
    return NextResponse.json(
      { error: 'daily_op_limit', message: 'You can only create or edit one road per day.' },
      { status: 429 }
    )
  }

  // Apply updates to road metadata
  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (color !== undefined) updates.color = color
  if (is_published !== undefined) updates.is_published = is_published

  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('roads')
      .update(updates)
      .eq('id', road.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update road.' }, { status: 500 })
    }
  }

  // Rebuild road_components if provided
  if (Array.isArray(component_ids) && component_ids.length > 0) {
    // Validate all components
    const { data: validComps } = await supabase
      .from('components')
      .select('id')
      .in('id', component_ids)
      .eq('is_published', true)

    if ((validComps ?? []).length !== component_ids.length) {
      return NextResponse.json({ error: 'One or more components are invalid.' }, { status: 400 })
    }

    // Delete existing and re-insert
    await supabase.from('road_components').delete().eq('road_id', road.id)
    await supabase.from('road_components').insert(
      component_ids.map((compId: string, index: number) => ({
        road_id: road.id,
        component_id: compId,
        sequence_order: index + 1,
      }))
    )
  }

  // Increment road_ops counter (cron resets to 0 at midnight)
  await supabase.from('users').update({ road_ops: (opsUser?.road_ops ?? 0) + 1 }).eq('id', userId)

  return NextResponse.json({ success: true })
}
