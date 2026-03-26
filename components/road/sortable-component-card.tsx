'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BuilderComponent } from '@/app/road/build/page'

interface SortableComponentCardProps {
  component: BuilderComponent
  index: number
  roadColor: string
  onRemove: () => void
}

export function SortableComponentCard({
  component,
  index,
  roadColor,
  onRemove,
}: SortableComponentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-[#111] border border-[#1F1F1F] rounded-sm px-4 py-3 flex items-center gap-3 hover:border-[#333] transition-colors",
        isDragging && "opacity-50 border-[#333]"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-4 h-4 text-[#333]" />
      </button>

      {/* Sequence number */}
      <span className="text-[#555] text-xs font-mono w-5 text-right">
        {index + 1}
      </span>

      {/* Component title */}
      <span className="text-white text-sm font-medium flex-1">
        {component.name}
      </span>

      {/* City badge */}
      <span
        className="text-[10px] rounded-sm px-1.5 py-0.5"
        style={{
          backgroundColor: `${component.cityColor}20`,
          color: component.cityColor,
        }}
      >
        {component.cityName}
      </span>

      {/* Duration */}
      <span className="text-[#555] text-xs">
        {component.estimatedMinutes}m
      </span>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="text-[#333] hover:text-[#F97316] transition-colors ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}
