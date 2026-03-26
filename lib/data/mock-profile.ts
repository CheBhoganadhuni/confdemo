// Mock data for the /profile page
// This will be replaced with Supabase queries when connected

export interface ProfileUser {
  id: string
  name: string
  email: string
  universityName: string
  departmentName: string
  year: string
  bolts: number
  xpPoints: number
  todayMinutes: number
}

export interface DailyTask {
  id: string
  type: 'github' | 'dsa' | 'linkedin' | 'study'
  title: string
  description: string
  completed: boolean
  unlocked: boolean
  unlockRequirement?: string
  progressCurrent?: number
  progressMax?: number
  url?: string
}

export interface RoadProgress {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  completionPercent: number
  completedComponents: number
  totalComponents: number
}

export interface CompletedLevel {
  id: string
  name: string
  cityId: string
  cityName: string
  cityColor: string
  completionPercent: number
}

export interface TokenHistoryEntry {
  id: string
  date: string
  xpEarned: number
  event: string
  eventType: 'component' | 'level' | 'road' | 'daily'
}

export interface ProfileData {
  user: ProfileUser
  dailyTasks: DailyTask[]
  cycleEndsIn: { hours: number; minutes: number }
  roads: RoadProgress[]
  completedLevels: CompletedLevel[]
  tokenHistory: TokenHistoryEntry[]
  streakCycles: number
}

// Mock user data
export const MOCK_PROFILE_USER: ProfileUser = {
  id: 'user-1',
  name: 'Jnana Sethu',
  email: 'jnana@vit.edu',
  universityName: 'VIT University',
  departmentName: 'Computer Science',
  year: '3RD YEAR',
  bolts: 42,
  xpPoints: 2450,
  todayMinutes: 24,
}

// Mock daily tasks
export const MOCK_DAILY_TASKS: DailyTask[] = [
  {
    id: 'task-1',
    type: 'github',
    title: 'GitHub Commit',
    description: 'Push at least one commit to any repository',
    completed: true,
    unlocked: true,
  },
  {
    id: 'task-2',
    type: 'dsa',
    title: 'DSA Problem',
    description: 'Solve one problem on LeetCode or similar',
    completed: false,
    unlocked: true,
  },
  {
    id: 'task-3',
    type: 'linkedin',
    title: 'LinkedIn Post',
    description: 'Share your learning progress',
    completed: false,
    unlocked: false,
    unlockRequirement: 'Algorithmic Jungle',
  },
  {
    id: 'task-4',
    type: 'study',
    title: 'Study Time',
    description: 'Complete 120 minutes of learning',
    completed: false,
    unlocked: true,
    progressCurrent: 24,
    progressMax: 120,
  },
]

// Mock road progress
export const MOCK_ROAD_PROGRESS: RoadProgress[] = [
  {
    id: 'full-stack',
    name: 'Full-Stack Engineer',
    slug: 'full-stack',
    color: '#F97316',
    icon: 'Layers',
    completionPercent: 35,
    completedComponents: 8,
    totalComponents: 24,
  },
  {
    id: 'vit-dsa-track',
    name: 'VIT DSA Track',
    slug: 'vit-dsa-track',
    color: '#10B981',
    icon: 'GraduationCap',
    completionPercent: 50,
    completedComponents: 8,
    totalComponents: 16,
  },
]

// Mock completed levels
export const MOCK_COMPLETED_LEVELS: CompletedLevel[] = [
  {
    id: 'bp-1',
    name: 'Hello World',
    cityId: 'beginners-picnic',
    cityName: "Beginner's Picnic",
    cityColor: '#10B981',
    completionPercent: 100,
  },
  {
    id: 'bp-2',
    name: 'Variables & Types',
    cityId: 'beginners-picnic',
    cityName: "Beginner's Picnic",
    cityColor: '#10B981',
    completionPercent: 100,
  },
  {
    id: 'bp-3',
    name: 'Control Flow',
    cityId: 'beginners-picnic',
    cityName: "Beginner's Picnic",
    cityColor: '#10B981',
    completionPercent: 50,
  },
  {
    id: 'aj-1',
    name: 'Arrays & Strings',
    cityId: 'algorithmic-jungle',
    cityName: 'Algorithmic Jungle',
    cityColor: '#059669',
    completionPercent: 100,
  },
  {
    id: 'aj-2',
    name: 'Linked Lists',
    cityId: 'algorithmic-jungle',
    cityName: 'Algorithmic Jungle',
    cityColor: '#059669',
    completionPercent: 60,
  },
  {
    id: 'dv-1',
    name: 'SQL Fundamentals',
    cityId: 'data-vault',
    cityName: 'Data Vault',
    cityColor: '#D97706',
    completionPercent: 100,
  },
  {
    id: 'er-1',
    name: 'React Fundamentals',
    cityId: 'engine-room',
    cityName: 'Engine Room',
    cityColor: '#0D9488',
    completionPercent: 100,
  },
  {
    id: 'er-2',
    name: 'State Management',
    cityId: 'engine-room',
    cityName: 'Engine Room',
    cityColor: '#0D9488',
    completionPercent: 75,
  },
]

// Mock token history
export const MOCK_TOKEN_HISTORY: TokenHistoryEntry[] = [
  {
    id: 'th-1',
    date: '2026-03-26',
    xpEarned: 50,
    event: 'Completed Arrays & Strings',
    eventType: 'level',
  },
  {
    id: 'th-2',
    date: '2026-03-25',
    xpEarned: 25,
    event: 'Daily Tasks Complete',
    eventType: 'daily',
  },
  {
    id: 'th-3',
    date: '2026-03-25',
    xpEarned: 30,
    event: 'React Components',
    eventType: 'component',
  },
  {
    id: 'th-4',
    date: '2026-03-24',
    xpEarned: 100,
    event: 'Variables & Types Level',
    eventType: 'level',
  },
  {
    id: 'th-5',
    date: '2026-03-24',
    xpEarned: 25,
    event: 'Daily Tasks Complete',
    eventType: 'daily',
  },
  {
    id: 'th-6',
    date: '2026-03-23',
    xpEarned: 50,
    event: 'Hello World Level',
    eventType: 'level',
  },
  {
    id: 'th-7',
    date: '2026-03-22',
    xpEarned: 200,
    event: 'Full-Stack 35% Milestone',
    eventType: 'road',
  },
  {
    id: 'th-8',
    date: '2026-03-21',
    xpEarned: 30,
    event: 'SQL Basics Component',
    eventType: 'component',
  },
  {
    id: 'th-9',
    date: '2026-03-20',
    xpEarned: 25,
    event: 'Daily Tasks Complete',
    eventType: 'daily',
  },
  {
    id: 'th-10',
    date: '2026-03-19',
    xpEarned: 40,
    event: 'Control Flow Partial',
    eventType: 'component',
  },
]

// Combined mock profile data
export const MOCK_PROFILE_DATA: ProfileData = {
  user: MOCK_PROFILE_USER,
  dailyTasks: MOCK_DAILY_TASKS,
  cycleEndsIn: { hours: 4, minutes: 32 },
  roads: MOCK_ROAD_PROGRESS,
  completedLevels: MOCK_COMPLETED_LEVELS,
  tokenHistory: MOCK_TOKEN_HISTORY,
  streakCycles: 7,
}
