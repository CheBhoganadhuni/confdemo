// Server component for /road/build
// Fetches cities with levels/components for the browser

import { MOCK_CITIES, getLevelsForCity, getComponentsForLevel } from '@/lib/data/mock-world'
import { MOCK_CUSTOM_ROADS } from '@/lib/data/mock-roads'
import { RoadBuilderClient } from '@/components/road/road-builder-client'

// Types for the builder
export interface BuilderComponent {
  id: string
  name: string
  cityId: string
  cityName: string
  cityColor: string
  levelId: string
  levelName: string
  estimatedMinutes: number
}

export interface BuilderCity {
  id: string
  name: string
  color: string
  icon: string
  components: BuilderComponent[]
}

async function getCitiesWithComponents(): Promise<BuilderCity[]> {
  // When Supabase is connected, this will be a real query
  // For now, use mock data
  
  return MOCK_CITIES.map(city => {
    const levels = getLevelsForCity(city.id)
    const components: BuilderComponent[] = []
    
    levels.forEach(level => {
      const levelComponents = getComponentsForLevel(level.id)
      levelComponents.forEach(comp => {
        components.push({
          id: comp.id,
          name: comp.name,
          cityId: city.id,
          cityName: city.name,
          cityColor: city.themeColor,
          levelId: level.id,
          levelName: level.name,
          estimatedMinutes: Math.floor(Math.random() * 60) + 30,
        })
      })
    })
    
    return {
      id: city.id,
      name: city.name,
      color: city.themeColor,
      icon: city.icon,
      components,
    }
  })
}

async function getUserRoadCount(): Promise<number> {
  // When Supabase is connected, count user's custom roads
  return MOCK_CUSTOM_ROADS.length
}

export default async function RoadBuildPage() {
  const [cities, userRoadCount] = await Promise.all([
    getCitiesWithComponents(),
    getUserRoadCount(),
  ])
  
  return (
    <RoadBuilderClient 
      cities={cities} 
      userRoadCount={userRoadCount}
      maxRoads={3}
    />
  )
}
