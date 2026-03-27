import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Columns in bolt_status that are NOT task flags — never checked for completion
const META_COLUMNS = new Set(['id', 'user_id', 'token_sent', 'created_at', 'updated_at'])

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauth' }, { status: 401 })

    const { data: bolt } = await supabase
      .from('bolt_status')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!bolt) {
      return NextResponse.json(
        { error: 'no_bolt_status', message: 'No task status found. Visit /profile first.' },
        { status: 400 }
      )
    }

    if (bolt.token_sent === true) {
      return NextResponse.json(
        { error: 'already_collected', message: 'Bolt already collected for this cycle.' },
        { status: 400 }
      )
    }

    // Dynamically find every task column (everything that isn't a meta column).
    // When a new task is added to bolt_status in future, zero code changes needed here.
    const taskColumns = Object.keys(bolt).filter(k => !META_COLUMNS.has(k))
    const pending = taskColumns.filter(col => bolt[col] !== true)

    if (pending.length > 0) {
      return NextResponse.json(
        {
          error: 'not_all_done',
          message: `Complete all tasks first. Pending: ${pending.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // All task columns are true — award bolt
    const { data: currentUser } = await supabase
      .from('users')
      .select('token_count')
      .eq('id', user.id)
      .single()

    const newCount = (currentUser?.token_count ?? 0) + 1

    await Promise.all([
      supabase.from('users')
        .update({ token_count: newCount, last_token_at: new Date().toISOString() })
        .eq('id', user.id),
      supabase.from('bolt_status')
        .update({ token_sent: true })
        .eq('user_id', user.id),
    ])

    return NextResponse.json({ success: true, new_token_count: newCount })
  } catch (error) {
    console.error('collect-bolt error:', error)
    return NextResponse.json({ error: 'server_error', message: 'Try again.' }, { status: 500 })
  }
}
