import { ProfileClient } from '@/components/profile/ProfileClient'
import { MOCK_PROFILE_DATA } from '@/lib/data/mock-profile'

export const metadata = {
  title: 'Profile | Jnana Sethu',
  description: 'Your player card and learning progress on Jnana Sethu.',
}

export default function ProfilePage() {
  // In production, this would fetch from Supabase:
  // - User with university + department
  // - Completed levels with completion %
  // - Road progress per road
  // - Token count, XP, today_time_minutes
  // - Daily tasks with unlock + completion status
  // - Streak cycles count

  const profileData = MOCK_PROFILE_DATA

  return <ProfileClient data={profileData} />
}
