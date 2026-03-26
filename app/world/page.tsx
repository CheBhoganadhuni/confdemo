import { WorldMapClient } from '@/components/world/world-map-client'
import { 
  MOCK_CITIES, 
  CITY_CONNECTIONS,
  getLevelsForCity,
  type WorldLevel
} from '@/lib/data/mock-world'

export const metadata = {
  title: 'World Map | Jnana Sethu',
  description: 'Explore the learning landscape. Navigate through cities, levels, and components.',
}

function getWorldData() {
  // Use mock data for now - will integrate with Supabase later
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
    isAuthenticated: true, // Allow access for now
  }
}

export default function WorldPage() {
  const worldData = getWorldData()
  
  return <WorldMapClient {...worldData} />
}
