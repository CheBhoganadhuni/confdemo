'use client'

import { useEffect, useRef } from 'react'

// ─── Octahedron geometry ────────────────────────────────────────────────────
// 6 vertices, 12 edges — gem/diamond shape, simple and professional
const OCT_VERTS: [number, number, number][] = [
  [ 1,  0,  0], // 0 +x
  [-1,  0,  0], // 1 -x
  [ 0,  1,  0], // 2 +y
  [ 0, -1,  0], // 3 -y
  [ 0,  0,  1], // 4 +z
  [ 0,  0, -1], // 5 -z
]

// Each pole (+x/-x) connects to all 4 equatorial; equatorial forms a square ring
const OCT_EDGES: [number, number][] = [
  [0, 2], [0, 3], [0, 4], [0, 5], // +x → equatorial
  [1, 2], [1, 3], [1, 4], [1, 5], // -x → equatorial
  [2, 4], [2, 5],                  // +y → +z, -z
  [3, 4], [3, 5],                  // -y → +z, -z
]

// ─── Shape instances ───────────────────────────────────────────────────────
interface Shape {
  xRatio: number; yRatio: number
  scale: number
  rotX: number; rotY: number; rotZ: number
  speedX: number; speedY: number; speedZ: number
  floatOffset: number; floatSpeed: number
  scrollFactor: number
}

// Three placement zones — large corner pair + small interior
// visibleCount in the render loop decides how many actually draw
const SHAPES_TEMPLATE: Shape[] = [
  {
    xRatio: 0.88, yRatio: 0.22, scale: 120,
    rotX: 0.3, rotY: 0.8, rotZ: 0.1,
    speedX: 0.003, speedY: 0.005, speedZ: 0.001,
    floatOffset: 0, floatSpeed: 0.0007,
    scrollFactor: 0.0004,
  },
  {
    xRatio: 0.09, yRatio: 0.72, scale: 100,
    rotX: 1.2, rotY: 0.4, rotZ: 0.6,
    speedX: -0.002, speedY: 0.004, speedZ: -0.003,
    floatOffset: 2.1, floatSpeed: 0.0009,
    scrollFactor: 0.0006,
  },
  {
    xRatio: 0.60, yRatio: 0.54, scale: 65,
    rotX: 0.7, rotY: 1.5, rotZ: 0.3,
    speedX: 0.004, speedY: -0.003, speedZ: 0.002,
    floatOffset: 4.3, floatSpeed: 0.0011,
    scrollFactor: 0.0003,
  },
]

// ─── Rotation helper ───────────────────────────────────────────────────────
function rotate3D(
  v: [number, number, number],
  rx: number, ry: number, rz: number
): [number, number, number] {
  let [x, y, z] = v

  // X-axis
  const y1 = y * Math.cos(rx) - z * Math.sin(rx)
  const z1 = y * Math.sin(rx) + z * Math.cos(rx)
  y = y1; z = z1

  // Y-axis
  const x2 =  x * Math.cos(ry) + z * Math.sin(ry)
  const z2 = -x * Math.sin(ry) + z * Math.cos(ry)
  x = x2; z = z2

  // Z-axis
  const x3 = x * Math.cos(rz) - y * Math.sin(rz)
  const y3 = x * Math.sin(rz) + y * Math.cos(rz)

  return [x3, y3, z]
}

// ─── Component ─────────────────────────────────────────────────────────────
interface AnimatedGeometryProps {
  className?: string
}

export function AnimatedGeometry({ className }: AnimatedGeometryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollYRef = useRef(0)
  const rafRef    = useRef(0)
  const shapesRef = useRef<Shape[]>(SHAPES_TEMPLATE.map(s => ({ ...s })))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const syncSize = () => {
      canvas.width  = canvas.offsetWidth  || canvas.clientWidth  || 800
      canvas.height = canvas.offsetHeight || canvas.clientHeight || 600
    }
    syncSize()

    const ro = new ResizeObserver(syncSize)
    ro.observe(canvas)

    let tick = 0

    const animate = () => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Responsive shape count: 1 on narrow, 2 on medium, 3 on wide
      const visibleCount = w < 640 ? 1 : w < 1024 ? 2 : 3

      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth   = 1.4
      ctx.globalAlpha = 1

      tick++
      const scroll = scrollYRef.current

      for (let i = 0; i < visibleCount; i++) {
        const s = shapesRef.current[i]

        s.rotX += s.speedX
        s.rotY += s.speedY
        s.rotZ += s.speedZ

        const scrollOffsetY = scroll * s.scrollFactor

        const cx = s.xRatio * w
        const cy = s.yRatio * h + Math.sin(tick * s.floatSpeed + s.floatOffset) * 10

        const pts: [number, number][] = OCT_VERTS.map(v => {
          const [rx, ry, rz] = rotate3D(v, s.rotX, s.rotY + scrollOffsetY, s.rotZ)
          return [cx + rx * s.scale, cy + ry * s.scale]
        })

        for (const [a, b] of OCT_EDGES) {
          ctx.beginPath()
          ctx.moveTo(pts[a][0], pts[a][1])
          ctx.lineTo(pts[b][0], pts[b][1])
          ctx.stroke()
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    animate()

    const onScroll = () => { scrollYRef.current = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'absolute inset-0 w-full h-full'}
      style={{ opacity: 0.12, pointerEvents: 'none' }}
    />
  )
}
