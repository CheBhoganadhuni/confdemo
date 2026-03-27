'use client'

import * as LucideIcons from 'lucide-react'

interface DynamicIconProps {
  name: string
  size?: number
  color?: string
  className?: string
}

export function DynamicIcon({ name, size = 20, color, className }: DynamicIconProps) {
  const Icon = (LucideIcons as unknown as Record<string, React.ElementType>)[name]
  if (!Icon) return <LucideIcons.Circle size={size} color={color} className={className} />
  return <Icon size={size} color={color} className={className} />
}
