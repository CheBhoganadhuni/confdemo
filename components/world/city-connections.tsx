'use client'

import type { WorldCityMapped } from './world-map-client'

interface CityConnectionsProps {
  cities: WorldCityMapped[]
  connections: [string, string][]
  highlightCity?: string[]
}

export function CityConnections({ cities, connections, highlightCity }: CityConnectionsProps) {
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
        <style>{`
          .city-line {
            stroke-dashoffset: 0;
            animation: dashflow 24s linear infinite;
          }
          @keyframes dashflow {
            to { stroke-dashoffset: -200; }
          }
        `}</style>
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
            strokeOpacity={isHighlighted ? 0.18 : 0.04}
            strokeDasharray="5 8"
            className="city-line transition-opacity duration-300"
          />
        )
      })}
    </svg>
  )
}
