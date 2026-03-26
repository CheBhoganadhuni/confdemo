// Database types matching the Supabase schema
// Run scripts/001-schema.sql when Supabase is connected

export type UserRole = 'student' | 'faculty' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  college_id: string | null
  avatar_url: string | null
  bolts: number
  current_city_id: string | null
  created_at: string
  updated_at: string
}

export interface College {
  id: string
  name: string
  code: string
  created_at: string
}

export interface CareerRoad {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon_url: string | null
  created_at: string
}

export interface City {
  id: string
  road_id: string
  name: string
  slug: string
  description: string | null
  order_index: number
  theme_color: string
  icon_url: string | null
  created_at: string
}

export interface Level {
  id: string
  city_id: string
  name: string
  slug: string
  order_index: number
  xp_required: number
  created_at: string
}

export interface Resource {
  id: string
  level_id: string
  title: string
  description: string | null
  type: 'video' | 'article' | 'quiz' | 'project' | 'external'
  url: string | null
  duration_minutes: number | null
  xp_reward: number
  order_index: number
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  resource_id: string
  completed: boolean
  completed_at: string | null
  xp_earned: number
  created_at: string
}

export interface StudySession {
  id: string
  user_id: string
  started_at: string
  ended_at: string | null
  duration_minutes: number
  city_id: string | null
}

export interface Achievement {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  xp_reward: number
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
}

// Computed/joined types for the app
export interface UserWithProgress extends Profile {
  total_xp: number
  completed_resources: number
  current_city?: City
  study_time_today: number // in minutes
}

export interface CityWithLevels extends City {
  levels: LevelWithResources[]
  road?: CareerRoad
}

export interface LevelWithResources extends Level {
  resources: Resource[]
  city?: City
}

export interface ResourceWithProgress extends Resource {
  progress?: UserProgress
  level?: Level
}
