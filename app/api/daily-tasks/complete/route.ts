import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/require-auth'

// ── Helper: check if a city is fully completed by a user ──────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isCityComplete(supabase: any, userId: string, citySlug: string): Promise<boolean> {
  const { data: city } = await supabase
    .from('cities').select('id').eq('slug', citySlug).single()
  if (!city) return false

  const { data: levels } = await supabase
    .from('levels').select('id').eq('city_id', city.id).eq('is_published', true)
  const levelIds = (levels ?? []).map((l: { id: string }) => l.id)
  if (!levelIds.length) return false

  const { data: levelComps } = await supabase
    .from('level_components').select('component_id').in('level_id', levelIds)
  const compIds = (levelComps ?? []).map((lc: { component_id: string }) => lc.component_id)
  if (!compIds.length) return false

  const { count } = await supabase
    .from('user_component_progress')
    .select('component_id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('status', 'completed').in('component_id', compIds)

  return (count ?? 0) >= compIds.length
}

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

    // ── Step 1: Get task ───────────────────────────────────────────────────────
    const { data: task, error: taskError } = await supabase
      .from('daily_tasks')
      .select('id, type, slug, unlock_after_city_slug')
      .eq('id', task_id)
      .eq('is_active', true)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // study_time: explicit confirm — only allowed when user has studied >= 60 min
    if (task.type === 'study_time') {
      const { data: userRow } = await supabase
        .from('users').select('today_time_minutes').eq('id', userId).single()
      if ((userRow?.today_time_minutes ?? 0) < 60) {
        return NextResponse.json(
          { error: 'not_enough_study', message: 'Study at least 60 minutes first.' },
          { status: 400 }
        )
      }
      await supabase
        .from('bolt_status')
        .upsert({ user_id: userId, study: true }, { onConflict: 'user_id' })
      return NextResponse.json({ success: true, task_type: 'study_time' })
    }

    // ── Step 2: Block if already done this cycle ───────────────────────────────
    // bolt_status column name === task.type (dsa → dsa, github → github, linkedin → linkedin)
    // This is intentional: task type IS the column key, so no hardcoded map is needed.
    const col = task.type as string

    const { data: bolt } = await supabase
      .from('bolt_status').select('*').eq('user_id', userId).single()

    if (bolt?.[col] === true) {
      return NextResponse.json(
        { error: 'already_done', message: 'Already completed for this cycle. Come back after the reset.' },
        { status: 400 }
      )
    }

    // ── Step 3: Hard two-gate check (city complete + account linked) ───────────
    // This runs on the SERVER for every submission — frontend state is irrelevant.
    // Gate 1: city completion (uses task.unlock_after_city_slug from DB — dynamic)
    if (task.unlock_after_city_slug) {
      const cityDone = await isCityComplete(supabase, userId, task.unlock_after_city_slug)
      if (!cityDone) {
        return NextResponse.json(
          {
            error: 'city_not_complete',
            message: `Complete the ${task.unlock_after_city_slug.replace(/-/g, ' ')} city before submitting.`,
          },
          { status: 403 }
        )
      }
    }

    // Gate 2: account linked (type-specific — github and linkedin require OAuth connection)
    if (task.type === 'github') {
      const { data: userRow } = await supabase
        .from('users').select('github_id').eq('id', userId).single()
      if (!userRow?.github_id) {
        return NextResponse.json(
          { error: 'account_not_linked', message: 'Connect your GitHub account before submitting a commit.' },
          { status: 403 }
        )
      }
    }

    if (task.type === 'linkedin') {
      const { data: userRow } = await supabase
        .from('users').select('linkedin_id').eq('id', userId).single()
      if (!userRow?.linkedin_id) {
        return NextResponse.json(
          { error: 'account_not_linked', message: 'Connect your LinkedIn account before submitting a post.' },
          { status: 403 }
        )
      }
    }

    // ── Step 4: Proof URL validation ───────────────────────────────────────────

    // DSA: require a LeetCode or HackerRank URL
    if (task.type === 'dsa') {
      if (!proof_url) {
        return NextResponse.json(
          { error: 'proof_required', message: 'Paste your LeetCode or HackerRank submission URL.' },
          { status: 400 }
        )
      }
      const isDsaUrl =
        (proof_url as string).includes('leetcode.com') ||
        (proof_url as string).includes('hackerrank.com')
      if (!isDsaUrl) {
        return NextResponse.json(
          { error: 'invalid_url', message: 'Please paste a LeetCode or HackerRank submission URL.' },
          { status: 400 }
        )
      }
    }

    // GitHub: full commit verification (city + account already confirmed above)
    if (task.type === 'github') {
      if (!proof_url) {
        return NextResponse.json(
          { error: 'proof_required', message: 'A GitHub commit URL is required.' },
          { status: 400 }
        )
      }

      const cleanUrl = (proof_url as string).trim()
      const commitRegex = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]{7,40})$/i
      const match = cleanUrl.match(commitRegex)

      if (!match) {
        return NextResponse.json(
          { error: 'invalid_url', message: 'Invalid commit URL. Use the form — enter username, repo, and SHA separately.' },
          { status: 400 }
        )
      }

      const [, owner, repo, sha] = match
      let ghData: Record<string, unknown> = {}

      try {
        const ghRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
          {
            headers: { 'User-Agent': 'jnanasethu-app', 'Accept': 'application/vnd.github.v3+json' },
            signal: AbortSignal.timeout(6000),
          }
        )
        if (ghRes.status === 404) {
          return NextResponse.json(
            { error: 'commit_not_found', message: 'Commit not found. Double-check the username, repo, and SHA. Make sure the repo is public.' },
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
        console.warn('GitHub API timeout — skipping date/author checks')
      }

      // Commit must be within 48 hours
      const commitObj = ghData.commit as Record<string, unknown> | undefined
      const authorObj = commitObj?.author as Record<string, unknown> | undefined
      const committerObj = commitObj?.committer as Record<string, unknown> | undefined
      const rawDate = (authorObj?.date ?? committerObj?.date) as string | undefined

      if (rawDate) {
        const hoursSince = (Date.now() - new Date(rawDate).getTime()) / (1000 * 60 * 60)
        if (hoursSince > 48) {
          return NextResponse.json(
            { error: 'commit_too_old', message: `This commit is ${Math.floor(hoursSince)} hours old. Submit a commit from the last 48 hours.` },
            { status: 400 }
          )
        }
      }

      // Commit author must match linked github_id
      const { data: userRow } = await supabase
        .from('users').select('github_id').eq('id', userId).single()
      const linkedId = (userRow as { github_id?: string | null } | null)?.github_id

      if (linkedId) {
        const ghAuthorLogin = (ghData.author as Record<string, unknown> | undefined)?.login as string | undefined
        if (ghAuthorLogin && ghAuthorLogin.toLowerCase() !== linkedId.toLowerCase()) {
          return NextResponse.json(
            { error: 'wrong_account', message: `This commit is by @${ghAuthorLogin}, not your connected account (@${linkedId}).` },
            { status: 400 }
          )
        }
      }
    }

    // LinkedIn: require a linkedin.com URL (account + city already confirmed above)
    if (task.type === 'linkedin') {
      if (!proof_url) {
        return NextResponse.json(
          { error: 'proof_required', message: 'Paste your LinkedIn post URL.' },
          { status: 400 }
        )
      }
      if (!(proof_url as string).includes('linkedin.com')) {
        return NextResponse.json(
          { error: 'invalid_url', message: 'Please paste a LinkedIn post URL (linkedin.com/posts/…)' },
          { status: 400 }
        )
      }
    }

    // ── Step 5: Mark done in bolt_status ──────────────────────────────────────
    // col === task.type, which matches the bolt_status column name by convention.
    // Adding a new task in future: add its type to daily_tasks and add matching
    // column to bolt_status — this line needs zero changes.
    await supabase
      .from('bolt_status')
      .upsert({ user_id: userId, [col]: true }, { onConflict: 'user_id' })

    // ── Step 6: Store proof in history ────────────────────────────────────────
    await supabase.from('user_task_completions').upsert(
      {
        user_id: userId,
        task_id,
        last_completed_at: new Date().toISOString(),
        proof_url: proof_url ?? null,
        total_completions: 1,
      },
      { onConflict: 'user_id,task_id' }
    )

    // Bolt collection is a separate explicit action — not awarded here
    return NextResponse.json({ success: true, task_type: task.type })

  } catch (error) {
    console.error('daily-tasks/complete error:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
