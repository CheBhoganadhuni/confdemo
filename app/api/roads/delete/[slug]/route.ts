import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const { slug } = await params

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

  // Check daily road operation limit
  const { data: opsUser } = await supabase
    .from('users')
    .select('road_ops')
    .eq('id', userId)
    .single()

  if ((opsUser?.road_ops ?? 0) >= 1) {
    return NextResponse.json(
      { error: 'daily_op_limit', message: 'You can only perform one road operation per day.' },
      { status: 429 }
    )
  }

  // Delete road_components first (cascade should handle it but be explicit)
  await supabase.from('road_components').delete().eq('road_id', road.id)
  // Remove from user_active_roads
  await supabase.from('user_active_roads').delete().eq('road_id', road.id)
  // Delete road
  const { error: deleteError } = await supabase.from('roads').delete().eq('id', road.id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete road.' }, { status: 500 })
  }

  // Increment road_ops
  await supabase.from('users').update({ road_ops: (opsUser?.road_ops ?? 0) + 1 }).eq('id', userId)

  return NextResponse.json({ success: true })
}
