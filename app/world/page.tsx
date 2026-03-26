import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorldMapClient } from '@/components/world/world-map-client'
import { 
  MOCK_CITIES, 
  CITY_CONNECTIONS,
  getLevelsForCity,
  type WorldCity,
  type WorldLevel
} from '@/lib/data/mock-world'

export const metadata = {
  title: 'World Map | Jnana Sethu',
  description: 'Explore the learning landscape. Navigate through cities, levels, and components.',
}

async function getWorldData() {
  const supabase = await createClient()
  
  // If Supabase is connected, fetch real data
  if (supabase) {
    // TODO: Replace with actual queries when Supabase is connected
    // const { data: cities } = await supabase
    //   .from('cities')
    //   .select('*, levels(count)')
    //   .eq('published', true)
    //   .order('order_index')
  }
  
  // For now, use mock data
  const cities = MOCK_CITIES
  const connections = CITY_CONNECTIONS
  
  // Build levels map
  const levelsByCity: Record<string, WorldLevel[]> = {}
  for (const city of cities) {
    levelsByCity[city.id] = getLevelsForCity(city.id)
  }
  
  return {
    cities,
    connections,
    levelsByCity,
    isAuthenticated: false, // Will be true when Supabase is connected
  }
}

export default async function WorldPage() {
  const supabase = await createClient()
  
  // Auth check - for now, allow access in dev mode
  // When Supabase is connected, uncomment:
  // const { data: { user } } = await supabase.auth.getUser()
  // if (!user) {
  //   redirect('/')
  // }
  
  const worldData = await getWorldData()
  
  // In production with Supabase, redirect if not authenticated
  // if (!worldData.isAuthenticated) {
  //   redirect('/')
  // }
  
  return <WorldMapClient {...worldData} />
}
