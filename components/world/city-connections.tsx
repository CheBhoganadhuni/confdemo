'use client'

import type { WorldCityMapped } from './world-map-client'

interface CityConnectionsProps {
  cities: WorldCityMapped[]
  connections: [string, string][]
  highlightCity?: string[]  // city slugs to highlight
}

export function CityConnections({ cities, connections, highlightCity }: CityConnectionsProps) {
  // Build slug → position map
  const positionBySlug = cities.reduce((acc, city) => {
    acc[city.slug] = {
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

      {connections.map(([fromSlug, toSlug], index) => {
        const from = positionBySlug[fromSlug]
        const to = positionBySlug[toSlug]

        if (!from || !to) return null

        const isHighlighted = highlightCity
          ? highlightCity.includes(fromSlug) && highlightCity.includes(toSlug)
          : true

        return (
          <line
            key={`${fromSlug}-${toSlug}-${index}`}
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
