import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'
import { generateSlug } from '@/lib/utils'


export async function POST(req: Request) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const { supabase, userId } = auth

  const body = await req.json().catch(() => null)
  const { title, description, color, component_ids, is_published } = body ?? {}

  if (!title || !color || !Array.isArray(component_ids) || component_ids.length === 0) {
    return NextResponse.json({ error: 'title, color, and component_ids required' }, { status: 400 })
  }

  // Check road count limit (max 3 custom roads)
  const { count: roadCount } = await supabase
    .from('roads')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)
    .eq('type', 'custom')

  if ((roadCount ?? 0) >= 3) {
    return NextResponse.json({ error: 'road_limit', message: 'Maximum 3 custom roads allowed.' }, { status: 403 })
  }

  // Check daily road operation limit via users.road_ops (cron resets to 0 at midnight)
  const { data: opsUser } = await supabase
    .from('users')
    .select('road_ops, university_id')
    .eq('id', userId)
    .single()

  if ((opsUser?.road_ops ?? 0) >= 1) {
    return NextResponse.json(
      { error: 'daily_op_limit', message: 'You can only create or edit one road per day.' },
      { status: 429 }
    )
  }

  // Validate all component_ids exist and are published
  const { data: validComps, error: compError } = await supabase
    .from('components')
    .select('id')
    .in('id', component_ids)
    .eq('is_published', true)

  if (compError || (validComps ?? []).length !== component_ids.length) {
    return NextResponse.json({ error: 'One or more components are invalid or unpublished.' }, { status: 400 })
  }

  // Generate unique slug
  let slug = generateSlug(title)
  const { data: existingSlug } = await supabase
    .from('roads')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingSlug) {
    slug = `${slug}-${Date.now()}`
  }

  // Insert road (reuse university_id already fetched above via opsUser)
  const roadType = is_published ? 'university' : 'custom'

  const { data: newRoad, error: roadError } = await supabase
    .from('roads')
    .insert({
      slug,
      title,
      description: description ?? null,
      type: roadType,
      created_by: userId,
      university_id: is_published ? (opsUser?.university_id ?? null) : null,
      color,
      icon: 'Target',
      is_published: is_published ?? false,
    })
    .select('id, slug')
    .single()

  if (roadError || !newRoad) {
    return NextResponse.json({ error: 'Failed to create road.' }, { status: 500 })
  }

  // Insert road_components
  const roadComponentRows = component_ids.map((compId: string, index: number) => ({
    road_id: newRoad.id,
    component_id: compId,
    sequence_order: index + 1,
  }))

  await supabase.from('road_components').insert(roadComponentRows)

  // Increment road_ops counter (cron resets to 0 at midnight)
  await supabase.from('users').update({ road_ops: (opsUser?.road_ops ?? 0) + 1 }).eq('id', userId)

  // Auto-join the road
  await supabase.from('user_active_roads').insert({
    user_id: userId,
    road_id: newRoad.id,
    joined_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, road_slug: newRoad.slug })
}
