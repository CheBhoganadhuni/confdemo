'use client'

import type { WorldCity } from '@/lib/data/mock-world'

interface CityConnectionsProps {
  cities: WorldCity[]
  connections: [string, string][]
  highlightCity?: string[]
}

export function CityConnections({ cities, connections, highlightCity }: CityConnectionsProps) {
  // Create a map of city positions
  const cityPositions = cities.reduce((acc, city) => {
    acc[city.id] = {
      left: parseFloat(city.position.left),
      top: parseFloat(city.position.top),
    }
    return acc
  }, {} as Record<string, { left: number; top: number }>)

  return (
    <svg 
      className="absolute inset-0 size-full pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <defs>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#F97316" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      {connections.map(([fromId, toId], index) => {
        const from = cityPositions[fromId]
        const to = cityPositions[toId]
        
        if (!from || !to) return null
        
        const isHighlighted = highlightCity 
          ? highlightCity.includes(fromId) && highlightCity.includes(toId)
          : true
        
        return (
          <line
            key={`${fromId}-${toId}-${index}`}
            x1={`${from.left}%`}
            y1={`${from.top}%`}
            x2={`${to.left}%`}
            y2={`${to.top}%`}
            stroke="#F97316"
            strokeWidth="1"
            strokeOpacity={isHighlighted ? 0.2 : 0.05}
            strokeDasharray="6 4"
            className="transition-opacity duration-300"
          />
        )
      })}
    </svg>
  )
}
