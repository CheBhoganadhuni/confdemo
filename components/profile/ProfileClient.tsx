'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Zap,
  Star,
  Clock,
  Lock,
  Check,
  Github,
  Code2,
  Linkedin,
  BookOpen,
  Layers,
  GraduationCap,
  ArrowRight,
  Info,
  GitCommit,
} from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '@/components/layout/navbar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ProfileUser {
  name: string
  email: string
  university_name?: string
  department_name?: string
  year?: number
  token_count: number
  xp_points: number
  today_minutes: number
  github_id?: string | null
  linkedin_id?: string | null
}

export interface ProfileTask {
  id: string
  type: 'github' | 'dsa' | 'linkedin' | 'study_time'
  title: string
  description?: string
  is_done: boolean
  is_unlocked: boolean
  unlock_reason?: string | null
  unlock_after_city_slug?: string
  study_minutes_today?: number
}

export interface BoltSummary {
  study: boolean
  dsa: boolean
  github: boolean
  linkedin: boolean
  token_sent: boolean
  all_unlocked_done: boolean
}

export interface ProfileRoad {
  id: string
  title: string
  slug: string
  color: string
  icon: string
  completion_percent: number
  completed_count: number
  total_count: number
}

export interface ProfileCompletedLevel {
  id: string
  slug: string
  title: string
  icon: string
  color: string
  city_id: string
  city_title: string
  city_color: string
  completion_percent: number
  completed_count: number
  total_count: number
}

export interface ProfileTokenEntry {
  id: string
  date: string
  event: string
}

interface ProfileClientProps {
  user: ProfileUser
  tasks: ProfileTask[]
  boltSummary: BoltSummary
  roads: ProfileRoad[]
  completedLevels: ProfileCompletedLevel[]
  tokenHistory: ProfileTokenEntry[]
}

// ── Static maps ───────────────────────────────────────────────────────────────
const TASK_ICONS: Record<ProfileTask['type'], React.ElementType> = {
  github: Github,
  dsa: Code2,
  linkedin: Linkedin,
  study_time: BookOpen,
}

const TASK_COLORS: Record<ProfileTask['type'], string> = {
  github: '#059669',
  dsa: '#7C3AED',
  linkedin: '#0284C7',
  study_time: '#F97316',
}

const ROAD_ICONS: Record<string, React.ElementType> = { Layers, GraduationCap }

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── GitHub Commit Dialog ──────────────────────────────────────────────────────
interface CommitDialogProps {
  taskId: string
  lockedUsername: string | null
  onSuccess: () => void
  onTokenEarned: () => void
}

function CommitDialog({ taskId, lockedUsername, onSuccess, onTokenEarned }: CommitDialogProps) {
  const [open, setOpen] = useState(false)
  const [ghUser, setGhUser] = useState(lockedUsername ?? '')
  const [ghRepo, setGhRepo] = useState('')
  const [ghSha, setGhSha] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const previewUrl =
    ghUser.trim() && ghRepo.trim() && ghSha.trim()
      ? `github.com/${ghUser.trim()}/${ghRepo.trim()}/commit/${ghSha.trim()}`
      : ''

  const handleSubmit = async () => {
    setDialogError('')
    const u = ghUser.trim()
    const r = ghRepo.trim()
    const s = ghSha.trim()
    if (!u || !r || !s) { setDialogError('All three fields are required.'); return }

    const constructedUrl = `https://github.com/${u}/${r}/commit/${s}`
    setLoading(true)
    try {
      const res = await fetch('/api/daily-tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, proof_url: constructedUrl }),
      })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch { setDialogError('Unexpected server response.'); return }

      if (!res.ok) { setDialogError((data.message as string) ?? 'Verification failed.'); return }

      setOpen(false)
      onSuccess()
      if (data.token_earned) {
        onTokenEarned()
        toast.success('⚡ Bolt earned!', { duration: 4000 })
      } else {
        toast.success('Commit verified! Task marked done.')
      }
    } catch {
      setDialogError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value); setDialogError('')
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setDialogError('') }}
        className="mt-3 bg-[#F97316] text-black text-xs font-bold px-3 h-8 rounded-sm hover:bg-[#EA6B0A] transition-colors"
      >
        Submit Today&apos;s Commit
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm bg-[#111] border border-[#1F1F1F] text-white p-6">
          <DialogHeader>
            <DialogTitle className="text-white font-bold text-base">Submit a GitHub Commit</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <div>
              <label className="text-xs text-[#A0A0A0] mb-1 block">Your GitHub Username</label>
              {lockedUsername ? (
                <div>
                  <input readOnly value={lockedUsername}
                    className="w-full h-9 bg-[#0A0A0A] border border-[#1F1F1F] text-[#555] text-sm px-3 rounded-sm cursor-not-allowed" />
                  <p className="text-[10px] text-[#444] mt-1 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Connected account
                  </p>
                </div>
              ) : (
                <input type="text" value={ghUser} onChange={field(setGhUser)} placeholder="e.g. chebhoganadhuni"
                  className="w-full h-9 bg-[#0A0A0A] border border-[#1F1F1F] text-white text-sm px-3 rounded-sm focus:outline-none focus:border-[#F97316]/60 placeholder:text-[#333]" />
              )}
            </div>

            <div>
              <label className="text-xs text-[#A0A0A0] mb-1 block">Repository Name</label>
              <input type="text" value={ghRepo} onChange={field(setGhRepo)} placeholder="e.g. confdemo"
                className="w-full h-9 bg-[#0A0A0A] border border-[#1F1F1F] text-white text-sm px-3 rounded-sm focus:outline-none focus:border-[#F97316]/60 placeholder:text-[#333]" />
            </div>

            <div>
              <label className="text-xs text-[#A0A0A0] mb-1 block">Commit SHA</label>
              <input type="text" value={ghSha} onChange={field(setGhSha)} placeholder="e.g. 6d0602da52..."
                className="w-full h-9 bg-[#0A0A0A] border border-[#1F1F1F] text-white text-sm px-3 rounded-sm font-mono focus:outline-none focus:border-[#F97316]/60 placeholder:text-[#333]" />
              <p className="text-[#444] text-[10px] mt-1">
                Your repo → Commits → click a commit → copy from the URL
              </p>
            </div>

            {previewUrl && (
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm px-3 py-2">
                <p className="text-[#555] text-xs font-mono break-all">{previewUrl}</p>
              </div>
            )}

            {dialogError && <p className="text-rose-400 text-xs leading-relaxed">{dialogError}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setOpen(false)}
                className="flex-1 h-9 border border-[#333] text-[#555] text-sm rounded-sm hover:border-[#555] hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 h-9 bg-[#F97316] hover:bg-[#EA6B0A] text-black text-sm font-bold rounded-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Verifying…' : 'Verify & Submit'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ProfileClient({
  user,
  tasks: initialTasks,
  boltSummary: initialBoltSummary,
  roads,
  completedLevels,
  tokenHistory,
}: ProfileClientProps) {
  const [tasks, setTasks] = useState<ProfileTask[]>(initialTasks)
  const [boltSummary, setBoltSummary] = useState<BoltSummary>(initialBoltSummary)
  const [taskUrls, setTaskUrls] = useState<Record<string, string>>({})
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [tokenCount, setTokenCount] = useState(user.token_count)
  const [githubId, setGithubId] = useState<string | null>(user.github_id ?? null)
  const [linkedinId, setLinkedinId] = useState<string | null>(user.linkedin_id ?? null)
  const [linkingGithub, setLinkingGithub] = useState(false)
  const [linkingLinkedin, setLinkingLinkedin] = useState(false)
  const [collectingBolt, setCollectingBolt] = useState(false)
  const [boltCollected, setBoltCollected] = useState(initialBoltSummary.token_sent)

  const setTaskError = (id: string, msg: string) =>
    setTaskErrors(prev => ({ ...prev, [id]: msg }))
  const clearTaskError = (id: string) =>
    setTaskErrors(prev => { const n = { ...prev }; delete n[id]; return n })

  const markTaskDone = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_done: true } : t))
    // Update bolt_summary locally
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      const colMap: Record<string, keyof BoltSummary> = {
        github: 'github', dsa: 'dsa', linkedin: 'linkedin', study_time: 'study'
      }
      const col = colMap[task.type]
      if (col) {
        setBoltSummary(prev => {
          const next = { ...prev, [col]: true }
          // Recompute all_unlocked_done:
          // Every field in BoltSummary except token_sent and all_unlocked_done must be true.
          // Mirrors the server's META_COLUMNS dynamic check — adding a new task field
          // to BoltSummary automatically requires it here too.
          const { all_unlocked_done: _a, token_sent: _t, ...taskFlags } = next
          next.all_unlocked_done = Object.values(taskFlags).every(v => v === true)
          return next
        })
      }
    }
  }

  // Handler for non-github tasks (dsa / linkedin)
  const handleTaskComplete = async (taskId: string, proofUrl: string) => {
    clearTaskError(taskId)
    setSubmitting(prev => ({ ...prev, [taskId]: true }))

    let res: Response
    try {
      res = await fetch('/api/daily-tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, proof_url: proofUrl || undefined }),
      })
    } catch {
      setTaskError(taskId, 'Network error — check your connection and try again.')
      setSubmitting(prev => ({ ...prev, [taskId]: false }))
      return
    }

    let data: Record<string, unknown> = {}
    try { data = await res.json() } catch { /* ignore */ }

    if (!res.ok) {
      setTaskError(taskId, (data.message as string) ?? 'Failed to mark task complete.')
      setSubmitting(prev => ({ ...prev, [taskId]: false }))
      return
    }

    markTaskDone(taskId)
    toast.success('Task marked done!')
    // Don't re-enable button — task is done
  }

  const handleConnectGithub = async () => {
    setLinkingGithub(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?action=sync_github&next=/profile`,
        },
      })
      if (error) {
        toast.error('Could not connect GitHub: ' + error.message)
        setLinkingGithub(false)
        return
      }
      // linkIdentity returns a URL to redirect to for the OAuth flow
      if (data?.url) {
        window.location.href = data.url
        // Don't setLinkingGithub(false) — user is navigating away
      } else {
        toast.error('Could not start GitHub OAuth. Make sure "Enable Manual Linking" is on in Supabase Auth settings.')
        setLinkingGithub(false)
      }
    } catch {
      toast.error('Network error. Try again.')
      setLinkingGithub(false)
    }
  }

  const handleConnectLinkedin = async () => {
    setLinkingLinkedin(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?action=sync_linkedin&next=/profile`,
        },
      })
      if (error) {
        toast.error('Could not connect LinkedIn: ' + error.message)
        setLinkingLinkedin(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url
      } else {
        toast.error('Could not start LinkedIn OAuth. Make sure "Enable Manual Linking" is on in Supabase Auth settings.')
        setLinkingLinkedin(false)
      }
    } catch {
      toast.error('Network error. Try again.')
      setLinkingLinkedin(false)
    }
  }

  const handleCollectBolt = async () => {
    setCollectingBolt(true)
    try {
      const res = await fetch('/api/daily-tasks/collect-bolt', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error((data.message as string) ?? 'Could not collect bolt.')
        return
      }
      setTokenCount(data.new_token_count)
      setBoltCollected(true)
      setBoltSummary(prev => ({ ...prev, token_sent: true }))
      toast.success('⚡ Bolt collected!', { duration: 4000 })
    } catch { toast.error('Network error. Try again.') }
    finally { setCollectingBolt(false) }
  }

  // Group levels by city
  const levelsByCity = completedLevels.reduce(
    (acc, level) => {
      if (!acc[level.city_id]) acc[level.city_id] = { cityTitle: level.city_title, cityColor: level.city_color, levels: [] }
      acc[level.city_id].levels.push(level)
      return acc
    },
    {} as Record<string, { cityTitle: string; cityColor: string; levels: ProfileCompletedLevel[] }>
  )

  const totalLevelsMastered = completedLevels.filter(l => l.completion_percent === 100).length
  const completedTasksCount = tasks.filter(t => t.is_done).length

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#0A0A0A]">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-[4.5rem] sm:pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-6">

              {/* Player Header */}
              <div className="bg-[#111] border border-[#1F1F1F] rounded-sm p-5 sm:p-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, #F97316 0%, transparent 70%)' }} />
                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-[#F97316] rounded-sm flex items-center justify-center flex-shrink-0">
                      <span className="text-black font-black text-2xl">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="font-black text-white text-xl sm:text-2xl tracking-tight truncate">{user.name}</h1>
                      <p className="text-[#A0A0A0] text-xs mt-1 truncate">
                        {user.university_name}{user.department_name ? ` · ${user.department_name}` : ''}
                      </p>
                      {user.year && (
                        <span className="inline-block text-[10px] bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-0.5 rounded-sm text-[#A0A0A0] tracking-wide uppercase mt-2">
                          Year {user.year}
                        </span>
                      )}
                      {githubId && (
                        <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-2">
                          <Github className="w-3 h-3" />@{githubId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 mt-5 border-t border-[#1F1F1F] pt-5 gap-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#F97316] flex-shrink-0" />
                      <div>
                        <div className="font-black text-white text-lg">{tokenCount}</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#555]">Bolts</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-[#A0A0A0] flex-shrink-0" />
                      <div>
                        <div className="font-black text-white text-lg">{user.xp_points.toLocaleString()}</div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-[#555]">XP</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-3 h-3 text-[#333] cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-[#111] border border-[#1F1F1F] text-white text-xs max-w-[180px]">
                              XP is earned by completing quizzes. Quizzes launching soon.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#A0A0A0] flex-shrink-0" />
                      <div>
                        <div className="font-black text-white text-lg">{formatTime(user.today_minutes)}</div>
                        <div className="text-[9px] uppercase tracking-wider text-[#555]">Today</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 48-hr cycle info */}
              <div className="flex items-start gap-2.5 rounded-sm border border-[#1F1F1F] bg-[#0D0D0D] px-4 py-3">
                <span className="mt-0.5 text-[#F97316]">⚡</span>
                <p className="text-[11px] leading-relaxed text-[#555]">
                  Tasks reset on a <span className="text-[#A0A0A0]">48-hour cycle</span>. Complete all tasks within the 2-day window to claim your bolt. Study time accumulates across both days, you don&apos;t need to hit 2 hours in a single sitting.
                </p>
              </div>

              {/* Daily Tasks */}
              <div className="bg-[#111] border border-[#1F1F1F] rounded-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-sm">{"Today's Tasks"}</h2>
                  <span className="text-[#F97316] text-xs">{completedTasksCount} / {tasks.length}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {tasks.map((task) => {
                    const Icon = TASK_ICONS[task.type]
                    const color = TASK_COLORS[task.type]
                    const isSubmitting = submitting[task.id]

                    // ── Locked ──
                    if (!task.is_unlocked) {
                      const needsGithub = task.unlock_reason?.includes('GitHub')
                      const needsLinkedin = task.unlock_reason?.includes('LinkedIn')

                      return (
                        <div key={task.id} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-sm p-3">
                          <div className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-[#333]" />
                            <span className="text-[#333] text-sm">{task.title}</span>
                          </div>
                          {task.unlock_reason && (
                            <p className="text-[10px] text-[#2A2A2A] mt-1.5 ml-5">{task.unlock_reason}</p>
                          )}
                          {/* Show connect button when only account connection is blocking */}
                          {needsGithub && (
                            <div className="mt-2 ml-5">
                              <button onClick={handleConnectGithub} disabled={linkingGithub}
                                className="text-[#F97316] text-xs font-medium hover:underline disabled:opacity-50">
                                {linkingGithub ? 'Connecting…' : 'Connect GitHub →'}
                              </button>
                            </div>
                          )}
                          {needsLinkedin && (
                            <div className="mt-2 ml-5">
                              <button onClick={handleConnectLinkedin} disabled={linkingLinkedin}
                                className="text-[#0284C7] text-xs font-medium hover:underline disabled:opacity-50">
                                {linkingLinkedin ? 'Connecting…' : 'Connect LinkedIn →'}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    }

                    // ── Done ──
                    if (task.is_done) {
                      return (
                        <div key={task.id} className="bg-[#0D0D0D] rounded-sm p-3"
                          style={{ borderWidth: 1, borderColor: `${color}4D` }}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4" style={{ color }} />
                              <span className="text-[#555] text-sm line-through">{task.title}</span>
                            </div>
                            {/* Study: show explicit confirm button until bolt.study is true */}
                            {task.type === 'study_time' && !boltSummary.study && (
                              <button
                                disabled={submitting[task.id]}
                                onClick={() => handleTaskComplete(task.id, '')}
                                className="text-[10px] text-[#F97316] font-semibold hover:underline disabled:opacity-50 flex-shrink-0"
                              >
                                {submitting[task.id] ? 'Saving…' : 'Mark Complete'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    }

                    // ── Active / Pending ──
                    return (
                      <div key={task.id}
                        className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-sm p-3 hover:border-[#2A2A2A] transition-colors"
                        style={{ borderLeftWidth: 2, borderLeftColor: color }}>
                        <Icon className="w-4 h-4 mb-2" style={{ color }} />
                        <h3 className="text-white text-sm font-medium">{task.title}</h3>
                        {task.description && <p className="text-[#555] text-xs mt-0.5">{task.description}</p>}

                        {/* study_time — no button, just progress bar */}
                        {task.type === 'study_time' && (
                          <div className="mt-3">
                            <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                              <div className="h-full bg-[#F97316] rounded-full transition-all"
                                style={{ width: `${Math.min(((task.study_minutes_today ?? 0) / 120) * 100, 100)}%` }} />
                            </div>
                            <p className="text-[#555] text-xs mt-1">{task.study_minutes_today ?? 0} / 120 min</p>
                            <p className="text-[#333] text-[10px] mt-1">Tracked automatically as you complete components.</p>
                          </div>
                        )}

                        {/* github — connect banner + commit dialog */}
                        {task.type === 'github' && (
                          <div className="mt-3">
                            {!githubId && (
                              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm p-3 mb-3">
                                <p className="text-[#A0A0A0] text-xs mb-1.5">Connect your GitHub for author verification</p>
                                <button onClick={handleConnectGithub} disabled={linkingGithub}
                                  className="text-[#F97316] text-xs font-medium hover:underline disabled:opacity-50">
                                  {linkingGithub ? 'Connecting…' : 'Connect GitHub →'}
                                </button>
                                <p className="text-[#444] text-[10px] mt-1.5">Without connecting, commits are still verified as real and recent.</p>
                              </div>
                            )}
                            {githubId && (
                              <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-3">
                                <GitCommit className="w-3.5 h-3.5" />Connected as @{githubId}
                              </div>
                            )}
                            <CommitDialog
                              taskId={task.id}
                              lockedUsername={githubId}
                              onSuccess={() => markTaskDone(task.id)}
                              onTokenEarned={() => setTokenCount(prev => prev + 1)}
                            />
                          </div>
                        )}

                        {/* dsa */}
                        {task.type === 'dsa' && (
                          <div className="mt-3">
                            <input type="url"
                              placeholder="leetcode.com/problems/… or hackerrank.com/…"
                              value={taskUrls[task.id] || ''}
                              onChange={(e) => { setTaskUrls(prev => ({ ...prev, [task.id]: e.target.value })); clearTaskError(task.id) }}
                              className="w-full h-8 bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm px-2 text-xs text-white placeholder:text-[#333] focus:outline-none focus:border-[#F97316]/50" />
                            <button
                              onClick={() => handleTaskComplete(task.id, taskUrls[task.id] || '')}
                              disabled={isSubmitting}
                              className="mt-2 bg-[#F97316] text-black text-xs font-bold px-3 h-8 rounded-sm hover:bg-[#EA6B0A] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                              {isSubmitting ? 'Submitting…' : 'Mark Done'}
                            </button>
                            {taskErrors[task.id] && <p className="text-rose-400 text-xs mt-2 leading-relaxed">{taskErrors[task.id]}</p>}
                          </div>
                        )}

                        {/* linkedin */}
                        {task.type === 'linkedin' && (
                          <div className="mt-3">
                            {!linkedinId && (
                              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm p-3 mb-3">
                                <p className="text-[#A0A0A0] text-xs mb-1.5">Connect your LinkedIn account</p>
                                <button onClick={handleConnectLinkedin} disabled={linkingLinkedin}
                                  className="text-[#0284C7] text-xs font-medium hover:underline disabled:opacity-50">
                                  {linkingLinkedin ? 'Connecting…' : 'Connect LinkedIn →'}
                                </button>
                              </div>
                            )}
                            <input type="url"
                              placeholder="linkedin.com/posts/…"
                              value={taskUrls[task.id] || ''}
                              onChange={(e) => { setTaskUrls(prev => ({ ...prev, [task.id]: e.target.value })); clearTaskError(task.id) }}
                              className="w-full h-8 bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm px-2 text-xs text-white placeholder:text-[#333] focus:outline-none focus:border-[#F97316]/50" />
                            <button
                              onClick={() => handleTaskComplete(task.id, taskUrls[task.id] || '')}
                              disabled={isSubmitting}
                              className="mt-2 bg-[#0284C7] text-white text-xs font-bold px-3 h-8 rounded-sm hover:bg-[#0270A8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                              {isSubmitting ? 'Submitting…' : 'Mark Done'}
                            </button>
                            {taskErrors[task.id] && <p className="text-rose-400 text-xs mt-2 leading-relaxed">{taskErrors[task.id]}</p>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Collect Bolt section */}
                <div className="mt-4">
                  {boltSummary.all_unlocked_done && !boltCollected && (
                    <div className="bg-[#F97316]/10 border border-[#F97316]/40 rounded-sm p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-5 h-5 text-[#F97316]" />
                          <span className="font-bold text-white text-sm">All tasks complete!</span>
                        </div>
                        <p className="text-[#A0A0A0] text-xs">Collect your bolt for this cycle.</p>
                      </div>
                      <button
                        onClick={handleCollectBolt}
                        disabled={collectingBolt}
                        className="bg-[#F97316] text-black font-bold text-sm px-5 h-9 rounded-sm hover:bg-[#EA6B0A] transition-colors disabled:opacity-60 flex-shrink-0">
                        {collectingBolt ? 'Collecting…' : 'Collect Bolt'}
                      </button>
                    </div>
                  )}
                  {boltCollected && boltSummary.all_unlocked_done && (
                    <div className="text-center py-2">
                      <span className="text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />Bolt collected this cycle.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-6">

              {/* Skills Earned */}
              <div className="bg-[#111] border border-[#1F1F1F] rounded-sm p-5 sm:p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-white font-bold text-sm">Skills Earned</h2>
                  {totalLevelsMastered > 0 && (
                    <span className="text-[10px] text-emerald-400 font-semibold">{totalLevelsMastered} mastered</span>
                  )}
                </div>
                <p className="text-[#444] text-xs mb-5">Complete levels on /world to build your skill tree.</p>

                {Object.keys(levelsByCity).length === 0 ? (
                  <p className="text-[#333] text-sm text-center py-6">No levels started yet — head to the World Map.</p>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(levelsByCity).map(([cityId, { cityTitle, cityColor, levels }]) => (
                      <div key={cityId}>
                        <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: cityColor }}>
                          {cityTitle}
                        </p>
                        <div className="space-y-3">
                          {levels.map((level) => (
                            <div key={level.id}>
                              <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: level.color || cityColor }} />
                                <span className="text-white text-sm font-medium flex-1 truncate">{level.title}</span>
                                {level.completion_percent === 100
                                  ? <span className="text-[10px] text-emerald-400 font-semibold flex-shrink-0">Complete</span>
                                  : <span className="text-[10px] text-[#555] flex-shrink-0">{level.completion_percent}%</span>
                                }
                              </div>
                              <div className="h-[2px] bg-[#1A1A1A] rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${level.completion_percent}%`, backgroundColor: level.color || cityColor }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Roads */}
              {roads.length > 0 && (
                <div className="bg-[#111] border border-[#1F1F1F] rounded-sm p-5 sm:p-6">
                  <h2 className="text-white font-bold text-sm mb-4">Your Roads</h2>
                  <div className="flex flex-col gap-3">
                    {roads.map((road) => {
                      const Icon = ROAD_ICONS[road.icon] ?? Layers
                      return (
                        <div key={road.id}
                          className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-sm p-3 flex hover:border-[#2A2A2A] transition-colors">
                          <div className="w-[3px] rounded-l-sm mr-3 flex-shrink-0" style={{ backgroundColor: road.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: road.color }} />
                              <span className="text-white font-medium text-sm truncate">{road.title}</span>
                            </div>
                            <div className="mt-2 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${road.completion_percent}%`, backgroundColor: road.color }} />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[#555] text-xs">{road.completion_percent}% · {road.completed_count}/{road.total_count}</p>
                              <Link href="/road" className="inline-flex items-center gap-1 text-[#F97316] text-xs hover:underline">
                                Continue <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {tokenHistory.length > 0 && (
                <div className="bg-[#111] border border-[#1F1F1F] rounded-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#1F1F1F]">
                    <h2 className="text-white font-bold text-sm">Recent Activity</h2>
                  </div>
                  <div className="divide-y divide-[#141414]">
                    {tokenHistory.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="px-5 py-3 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[#444] w-14 flex-shrink-0">{formatDate(entry.date)}</span>
                          <span className="text-[#A0A0A0] truncate">{entry.event}</span>
                        </div>
                        <span className="flex items-center gap-1 text-emerald-500 font-semibold flex-shrink-0">
                          <Check className="w-3 h-3" />Done
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
