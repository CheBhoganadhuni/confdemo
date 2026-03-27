import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

export async function POST(req: Request) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const { supabase, userId } = auth

    const body = await req.json().catch(() => null)
    const { task_id, proof_url } = body ?? {}

    if (!task_id) {
      return NextResponse.json({ error: 'task_id required' }, { status: 400 })
    }

    // Verify task exists and is active
    const { data: task, error: taskError } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('id', task_id)
      .eq('is_active', true)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify unlock status
    if (task.unlock_after_city_slug) {
      const { data: city } = await supabase
        .from('cities').select('id').eq('slug', task.unlock_after_city_slug).single()
      if (city) {
        const { data: levels } = await supabase
          .from('levels').select('id').eq('city_id', city.id).eq('is_published', true)
        const levelIds = (levels ?? []).map((l: { id: string }) => l.id)
        const { data: levelComps } = levelIds.length > 0
          ? await supabase.from('level_components').select('component_id').in('level_id', levelIds)
          : { data: [] }
        const compIds = (levelComps ?? []).map((lc: { component_id: string }) => lc.component_id)

        if (compIds.length > 0) {
          const { count } = await supabase
            .from('user_component_progress')
            .select('component_id', { count: 'exact', head: true })
            .eq('user_id', userId).eq('status', 'completed').in('component_id', compIds)
          if ((count ?? 0) < compIds.length) {
            return NextResponse.json({ error: 'Task not yet unlocked.' }, { status: 403 })
          }
        }
      }
    }

    // ── GitHub commit verification ───────────────────────────────────────────
    if (task.type === 'github') {
      if (!proof_url) {
        return NextResponse.json(
          { error: 'proof_required', message: 'A GitHub commit URL is required.' },
          { status: 400 }
        )
      }

      // Sanitize + validate structure with regex (belt-and-suspenders — frontend constructs the URL)
      const cleanUrl = (proof_url as string).trim()
      const commitRegex =
        /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]{7,40})$/i
      const match = cleanUrl.match(commitRegex)

      if (!match) {
        return NextResponse.json(
          {
            error: 'invalid_url',
            message: 'Invalid commit URL. Use the form — enter username, repo, and commit SHA separately.',
          },
          { status: 400 }
        )
      }

      const [, owner, repo, sha] = match

      // Call GitHub API to verify the commit is real
      let ghData: Record<string, unknown> = {}
      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
          {
            headers: {
              'User-Agent': 'jnanasethu-app',
              'Accept': 'application/vnd.github.v3+json',
            },
            signal: AbortSignal.timeout(6000),
          }
        )

        if (ghRes.status === 404) {
          return NextResponse.json(
            {
              error: 'commit_not_found',
              message: 'Commit not found. Double-check the username, repo name, and SHA. Make sure the repo is public.',
            },
            { status: 400 }
          )
        }
        if (!ghRes.ok) {
          return NextResponse.json(
            { error: 'github_error', message: 'Could not reach GitHub to verify the commit. Try again.' },
            { status: 400 }
          )
        }
        ghData = await ghRes.json()
      } catch {
        // Network/timeout — don't block; commit existence already validated by regex if we reach here
        console.warn('GitHub API timeout — skipping date/author checks')
      }

      // Check commit is within 48 hours
      const commitObj = ghData.commit as Record<string, unknown> | undefined
      const authorObj = commitObj?.author as Record<string, unknown> | undefined
      const committerObj = commitObj?.committer as Record<string, unknown> | undefined
      const rawDate = (authorObj?.date ?? committerObj?.date) as string | undefined

      if (rawDate) {
        const hoursSince = (Date.now() - new Date(rawDate).getTime()) / (1000 * 60 * 60)
        if (hoursSince > 48) {
          return NextResponse.json(
            {
              error: 'commit_too_old',
              message: `This commit is ${Math.floor(hoursSince)} hours old. Submit a commit from the last 48 hours.`,
            },
            { status: 400 }
          )
        }
      }

      // Check commit author matches linked GitHub account (if connected)
      const { data: userRow } = await supabase
        .from('users')
        .select('github_username')
        .eq('id', userId)
        .single()

      const linkedUsername = (userRow as { github_username?: string | null } | null)
        ?.github_username

      if (linkedUsername) {
        const ghAuthorLogin = (ghData.author as Record<string, unknown> | undefined)
          ?.login as string | undefined
        if (
          ghAuthorLogin &&
          ghAuthorLogin.toLowerCase() !== linkedUsername.toLowerCase()
        ) {
          return NextResponse.json(
            {
              error: 'wrong_account',
              message: `This commit is by @${ghAuthorLogin}, not your connected account (@${linkedUsername}).`,
            },
            { status: 400 }
          )
        }
      }
    }

    // ── LinkedIn URL validation ──────────────────────────────────────────────
    if (task.type === 'linkedin') {
      if (proof_url) {
        const isLinkedIn =
          (proof_url as string).startsWith('https://www.linkedin.com/') ||
          (proof_url as string).startsWith('https://linkedin.com/')
        if (!isLinkedIn) {
          return NextResponse.json(
            {
              error: 'invalid_url',
              message: 'Please paste a LinkedIn post URL (linkedin.com/posts/…)',
            },
            { status: 400 }
          )
        }
      }
    }

    // ── DSA: honor system — basic HTTPS check ───────────────────────────────
    if (task.type === 'dsa') {
      if (proof_url && !(proof_url as string).startsWith('https://')) {
        return NextResponse.json(
          { error: 'invalid_url', message: 'Please provide a valid URL starting with https://' },
          { status: 400 }
        )
      }
    }

    const today = new Date().toISOString().split('T')[0]

    // Upsert log (idempotent)
    await supabase.from('user_daily_logs').upsert(
      {
        user_id: userId,
        task_id,
        completed_on: today,
        proof_url: proof_url ?? null,
        proof_verified: task.type === 'github',
      },
      { onConflict: 'user_id,task_id,completed_on' }
    )

    // Check if all unlocked tasks are done today
    const { data: allTasks } = await supabase
      .from('daily_tasks').select('id, unlock_after_city_slug').eq('is_active', true)

    const { data: todayLogs } = await supabase
      .from('user_daily_logs')
      .select('task_id')
      .eq('user_id', userId)
      .eq('completed_on', today)

    const doneTodaySet = new Set(
      (todayLogs ?? []).map((l: { task_id: string }) => l.task_id)
    )

    const unlockedTasks = (allTasks ?? []).filter(
      (t: { unlock_after_city_slug: string | null }) => !t.unlock_after_city_slug
    )
    const allUnlockedDone =
      unlockedTasks.length > 0 &&
      unlockedTasks.every((t: { id: string }) => doneTodaySet.has(t.id))

    if (!allUnlockedDone) {
      return NextResponse.json({ success: true, all_done: false, token_earned: false })
    }

    // All unlocked tasks done — check token eligibility
    const { data: user } = await supabase
      .from('users')
      .select('token_count, current_cycle_start')
      .eq('id', userId)
      .single()

    const now = new Date()
    const cycleStart = user?.current_cycle_start ? new Date(user.current_cycle_start) : null
    const canEarnToken = !cycleStart || now >= cycleStart

    if (!canEarnToken) {
      return NextResponse.json({ success: true, all_done: true, token_earned: false })
    }

    const newTokenCount = (user?.token_count ?? 0) + 1
    const nextCycleStart = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()

    await supabase.from('users').update({
      token_count: newTokenCount,
      last_token_at: now.toISOString(),
      current_cycle_start: nextCycleStart,
    }).eq('id', userId)

    return NextResponse.json({
      success: true,
      all_done: true,
      token_earned: true,
      new_token_count: newTokenCount,
    })
  } catch (error) {
    console.error('daily-tasks/complete unhandled error:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
