'use client'

import { useState } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { PolyBackground } from '@/components/ui/poly-background'
import { Navbar } from '@/components/layout/navbar'

// ── Types exported for page.tsx to use ─────────────────────────────────────
export interface ProfileUser {
  name: string
  email: string
  university_name?: string
  department_name?: string
  year?: number
  token_count: number
  xp_points: number
  today_minutes: number
}

export interface ProfileTask {
  id: string
  type: 'github' | 'dsa' | 'linkedin' | 'study_time'
  title: string
  description?: string
  is_done_today: boolean
  is_unlocked: boolean
  unlock_after_city_slug?: string
  study_minutes_today?: number
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
  title: string
  city_id: string
  city_title: string
  city_color: string
  completion_percent: number
}

export interface ProfileTokenEntry {
  id: string
  date: string
  xp_earned: number
  event: string
}

// ── Props ───────────────────────────────────────────────────────────────────
interface ProfileClientProps {
  user: ProfileUser
  tasks: ProfileTask[]
  cycleEndsIn: { hours: number; minutes: number }
  roads: ProfileRoad[]
  completedLevels: ProfileCompletedLevel[]
  tokenHistory: ProfileTokenEntry[]
}

// ── Static maps ─────────────────────────────────────────────────────────────
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

const ROAD_ICONS: Record<string, React.ElementType> = {
  Layers,
  GraduationCap,
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function slugToTitle(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ── Component ────────────────────────────────────────────────────────────────
export function ProfileClient({
  user,
  tasks: initialTasks,
  cycleEndsIn,
  roads,
  completedLevels,
  tokenHistory,
}: ProfileClientProps) {
  const [tasks, setTasks] = useState<ProfileTask[]>(initialTasks)
  const [taskUrls, setTaskUrls] = useState<Record<string, string>>({})
  const [tokenCount, setTokenCount] = useState(user.token_count)

  const completedTasksCount = tasks.filter(t => t.is_done_today).length
  const allTasksComplete = tasks.filter(t => t.is_unlocked).every(t => t.is_done_today)

  const handleTaskComplete = async (taskId: string, proofUrl: string) => {
    const res = await fetch('/api/daily-tasks/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, proof_url: proofUrl || undefined }),
    })
    const data = await res.json()

    if (!res.ok) {
      if (data.error === 'invalid_commit' || data.error === 'invalid_url') {
        toast.error('Invalid GitHub commit URL. Make sure it links to a real commit.')
      } else {
        toast.error(data.message ?? 'Failed to mark task complete.')
      }
      return
    }

    if (data.success) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_done_today: true } : t))
      if (data.token_earned) {
        toast.success('Token earned! Great work today.', { duration: 4000 })
        setTokenCount(prev => prev + 1)
      }
    }
  }

  // Group completed levels by city
  const levelsByCity = completedLevels.reduce(
    (acc, level) => {
      if (!acc[level.city_id]) {
        acc[level.city_id] = {
          cityTitle: level.city_title,
          cityColor: level.city_color,
          levels: [],
        }
      }
      acc[level.city_id].levels.push(level)
      return acc
    },
    {} as Record<string, { cityTitle: string; cityColor: string; levels: ProfileCompletedLevel[] }>
  )

  const totalLevelsMastered = completedLevels.filter(l => l.completion_percent === 100).length

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pt-18 sm:pt-20">
        {/* Section A: Player Header */}
        <div className="bg-[#111] border border-[#1F1F1F] rounded-sm p-4 sm:p-8 mb-4 sm:mb-6 relative overflow-hidden">
          <PolyBackground variant="corner-right" className="text-[#F97316] opacity-5" />

          <div className="relative z-10">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] bg-[#F97316] rounded-sm flex items-center justify-center flex-shrink-0">
                <span className="text-black font-black text-2xl sm:text-3xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="font-black text-white text-xl sm:text-3xl tracking-tight truncate">
                  {user.name}
                </h1>
                <p className="text-[#A0A0A0] text-xs sm:text-sm mt-1 truncate">
                  {user.university_name}
                  {user.department_name ? ` · ${user.department_name}` : ''}
                </p>
                {user.year && (
                  <span className="inline-block text-[10px] bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-0.5 rounded-sm text-[#A0A0A0] tracking-wide uppercase mt-2">
                    Year {user.year}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-6 mt-4 sm:mt-6 border-t border-[#1F1F1F] pt-4 sm:pt-6">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#F97316]" />
                <div>
                  <div className="font-black text-white text-lg sm:text-2xl">{tokenCount}</div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#555] mt-0.5">Bolts</div>
                </div>
              </div>

              <div className="hidden sm:block w-px h-10 bg-[#1F1F1F]" />

              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-[#A0A0A0]" />
                <div>
                  <div className="font-black text-white text-lg sm:text-2xl">
                    {user.xp_points.toLocaleString()}
                  </div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#555] mt-0.5">XP</div>
                </div>
              </div>

              <div className="hidden sm:block w-px h-10 bg-[#1F1F1F]" />

              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#A0A0A0]" />
                <div>
                  <div className="font-black text-white text-lg sm:text-2xl">
                    {formatTime(user.today_minutes)}
                  </div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#555] mt-0.5">Today</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Daily Tasks */}
        <div className="bg-[#111] border border-[#1F1F1F] rounded-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-white font-bold text-sm">{"Today's Tasks"}</h2>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-[#F97316] text-xs">
                {completedTasksCount} / {tasks.length} done
              </span>
              {(cycleEndsIn.hours > 0 || cycleEndsIn.minutes > 0) && (
                <span className="text-[#555] text-xs">
                  Cycle ends in {cycleEndsIn.hours}h {cycleEndsIn.minutes}m
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {tasks.map((task) => {
              const Icon = TASK_ICONS[task.type]
              const color = TASK_COLORS[task.type]

              if (!task.is_unlocked) {
                return (
                  <div key={task.id} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-sm p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#333]" />
                      <span className="text-[#333] text-sm">{task.title}</span>
                    </div>
                    {task.unlock_after_city_slug && (
                      <p className="text-[10px] text-[#333] mt-1">
                        Complete {slugToTitle(task.unlock_after_city_slug)} to unlock
                      </p>
                    )}
                  </div>
                )
              }

              if (task.is_done_today) {
                return (
                  <div
                    key={task.id}
                    className="bg-[#0D0D0D] rounded-sm p-3 sm:p-4"
                    style={{ borderWidth: 1, borderColor: `${color}4D` }}
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" style={{ color }} />
                      <span className="text-[#A0A0A0] text-sm line-through">{task.title}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={task.id}
                  className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-sm p-3 sm:p-4 hover:border-[#F97316]/40 transition-colors"
                  style={{ borderLeftWidth: 2, borderLeftColor: color }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                  <h3 className="text-white text-sm font-medium mt-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-[#555] text-xs mt-1">{task.description}</p>
                  )}

                  {task.type === 'study_time' && task.study_minutes_today !== undefined && (
                    <div className="mt-3">
                      <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F97316] rounded-full transition-all"
                          style={{ width: `${Math.min((task.study_minutes_today / 120) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-[#555] text-xs mt-1">
                        {task.study_minutes_today} / 120 min
                      </p>
                    </div>
                  )}

                  {task.type !== 'study_time' && (
                    <div className="mt-3">
                      <input
                        type="url"
                        placeholder="Paste URL here..."
                        value={taskUrls[task.id] || ''}
                        onChange={(e) =>
                          setTaskUrls(prev => ({ ...prev, [task.id]: e.target.value }))
                        }
                        className="w-full h-8 bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm px-2 text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#F97316]/50"
                      />
                      <button
                        onClick={() => handleTaskComplete(task.id, taskUrls[task.id] || '')}
                        className="mt-2 bg-[#F97316] text-black text-xs font-bold px-3 h-8 rounded-sm hover:bg-[#EA6B0A] transition-colors"
                      >
                        Mark Done
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {allTasksComplete && tasks.filter(t => t.is_unlocked).length > 0 && (
            <div className="mt-4 bg-[#F97316]/10 border border-[#F97316]/30 rounded-sm p-3 text-center flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-[#F97316]" />
              <span className="text-[#F97316] font-bold text-sm">All tasks complete! Bolt earned.</span>
            </div>
          )}
        </div>

        {/* Section C: Active Roads */}
        {roads.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h2 className="text-white font-bold text-sm mb-3 sm:mb-4">Your Roads</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roads.map((road) => {
                const Icon = ROAD_ICONS[road.icon] ?? Layers
                return (
                  <div
                    key={road.id}
                    className="bg-[#111] border border-[#1F1F1F] rounded-sm p-3 sm:p-4 hover:border-[#333] transition-colors flex"
                  >
                    <div
                      className="w-[3px] rounded-l-sm mr-3 sm:mr-4 flex-shrink-0"
                      style={{ backgroundColor: road.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: road.color }} />
                        <span className="text-white font-medium text-sm truncate">{road.title}</span>
                      </div>
                      <div className="mt-2 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${road.completion_percent}%`, backgroundColor: road.color }}
                        />
                      </div>
                      <p className="text-[#555] text-xs mt-1">
                        {road.completion_percent}% · {road.completed_count}/{road.total_count} components
                      </p>
                      <Link
                        href="/road"
                        className="inline-flex items-center gap-1 text-[#F97316] text-xs mt-2 hover:underline"
                      >
                        Continue <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Section D: Skills */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-white font-bold text-sm mb-1">Skills Earned</h2>
          <p className="text-[#555] text-xs mb-4">
            Based on completed levels — {totalLevelsMastered} levels mastered
          </p>

          {Object.keys(levelsByCity).length === 0 ? (
            <div className="text-[#333] text-sm text-center py-8">
              Complete levels on /world to earn skills here.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(levelsByCity).map(([cityId, { cityTitle, cityColor, levels }]) => (
                <div key={cityId}>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: cityColor }}>
                    {cityTitle}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {levels.map((level) => {
                      const isComplete = level.completion_percent === 100
                      return (
                        <span
                          key={level.id}
                          className="text-xs px-2.5 sm:px-3 py-1 rounded-sm font-medium flex items-center gap-1"
                          style={{
                            borderWidth: 1,
                            borderColor: isComplete ? cityColor : `${cityColor}4D`,
                            backgroundColor: `${cityColor}1A`,
                            color: isComplete ? cityColor : `${cityColor}CC`,
                          }}
                        >
                          {level.title}
                          {isComplete && <Star className="w-2.5 h-2.5" />}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section E: Token History */}
        {tokenHistory.length > 0 && (
          <div className="bg-[#111] border border-[#1F1F1F] rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1F1F1F]">
              <h2 className="text-white font-bold text-sm">Recent Activity</h2>
            </div>
            <div className="divide-y divide-[#1A1A1A]">
              {tokenHistory.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="px-3 sm:px-4 py-3 flex items-center justify-between text-xs gap-2"
                >
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <span className="text-[#555] w-14 sm:w-16 flex-shrink-0">{formatDate(entry.date)}</span>
                    <span className="text-[#A0A0A0] truncate">{entry.event}</span>
                  </div>
                  <span className="text-[#F97316] font-bold flex-shrink-0">+{entry.xp_earned} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
