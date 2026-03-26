// Database types matching the Supabase schema
// Run scripts/001-schema.sql when Supabase is connected

export interface University {
  id: string
  name: string
  slug: string
  university_code?: string
  invite_secret: string
  city?: string
  state?: string
  access: boolean
  created_at: string
}

export interface Department {
  id: string
  university_id: string
  name: string
  code: string
}

export interface PreRegisteredStudent {
  id: string
  university_id: string
  department_id?: string
  email: string
  name?: string
  year?: number
}

export interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
  role: 'student' | 'faculty' | 'university_admin' | 'platform_admin'
  university_id?: string
  department_id?: string
  year?: number
  goal?: string
  github_username?: string
  linkedin_id?: string
  xp_points: number
  token_count: number
  today_time_minutes: number
  today_date?: string
  last_token_at?: string
  current_cycle_start?: string
  onboarding_complete: boolean
  road_ops: number        // incremented on each create/update; cron resets to 0 at midnight
  created_at: string
  university?: University
  department?: Department
}

export interface City {
  id: string
  slug: string
  title: string
  description?: string
  icon: string
  color: string
  bg_theme: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_hours: number
  is_published: boolean
  created_at: string
}

export interface Level {
  id: string
  slug: string
  title: string
  description?: string
  icon: string
  color: string
  city_id: string
  sequence_order: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  is_checkpoint: boolean
  is_published: boolean
  created_at: string
}

export interface Component {
  id: string
  slug: string
  title: string
  description?: string
  duration_minutes: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  is_published: boolean
  created_at: string
}

export interface LevelComponent {
  id: string
  level_id: string
  component_id: string
  sequence_order: number
}

export interface Resource {
  id: string
  component_id: string
  title: string
  url: string
  type: 'video' | 'article' | 'doc' | 'sheet' | 'course'
  provider?: string
  duration_minutes?: number
  is_primary: boolean
}

export interface Road {
  id: string
  slug: string
  title: string
  description?: string
  type: 'preset' | 'university' | 'custom'
  created_by?: string
  university_id?: string
  color: string
  icon: string
  is_published: boolean
  created_at: string
}

export interface RoadComponent {
  id: string
  road_id: string
  component_id: string
  sequence_order: number
}

export interface UserComponentProgress {
  id: string
  user_id: string
  component_id: string
  status: 'in_progress' | 'completed'
  completed_at?: string
  earned_on_road_id?: string
}

export interface UserActiveRoad {
  id: string
  user_id: string
  road_id: string
  joined_at: string
}

export interface DailyTask {
  id: string
  slug: string
  title: string
  description?: string
  icon: string
  type: 'github' | 'dsa' | 'linkedin' | 'study_time'
  unlock_after_city_slug?: string
  is_active: boolean
}

export interface UserDailyLog {
  id: string
  user_id: string
  task_id: string
  completed_on: string
  proof_url?: string
  proof_verified: boolean
}

export interface Notification {
  id: string
  type: 'global' | 'university' | 'personal'
  university_id?: string
  user_id?: string
  sender_id?: string
  title: string
  body?: string
  created_at: string
}

// Computed/joined types used in UI
export interface CityWithProgress extends City {
  levels: Level[]
  completion_percent: number
  completed_levels: number
  total_levels: number
  active_student_count: number
}

export interface LevelWithProgress extends Level {
  components: ComponentWithProgress[]
  completion_percent: number
  completed_count: number
  total_count: number
  estimated_hours_remaining: number
}

export interface ComponentWithProgress extends Component {
  resources: Resource[]
  progress_status?: 'in_progress' | 'completed'
  completed_at?: string
}

export interface RoadWithProgress extends Road {
  components: ComponentWithProgress[]
  completion_percent: number
  completed_count: number
  total_count: number
}
