import { Metadata } from 'next'
import { RoadPageClient } from '@/components/road/road-page-client'
import { 
  MOCK_ROADS, 
  MOCK_UNIVERSITY_ROADS, 
  MOCK_CUSTOM_ROADS,
  MOCK_DAILY_PROGRESS 
} from '@/lib/data/mock-roads'

export const metadata: Metadata = {
  title: 'Roads | Jnana Sethu',
  description: 'Choose your learning path. Work through curated components to build real skills.',
}

// When Supabase is connected, this will fetch:
// - All preset roads
// - All published university roads for user's university
// - User's custom roads
// - User's component progress summary
// - User's daily study time

export default async function RoadPage() {
  // Mock data - replace with Supabase queries
  const presetRoads = MOCK_ROADS
  const universityRoads = MOCK_UNIVERSITY_ROADS
  const customRoads = MOCK_CUSTOM_ROADS
  const dailyProgress = MOCK_DAILY_PROGRESS

  return (
    <RoadPageClient
      presetRoads={presetRoads}
      universityRoads={universityRoads}
      customRoads={customRoads}
      dailyProgress={dailyProgress}
    />
  )
}
