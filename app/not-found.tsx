'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PolyBackground } from '@/components/ui/poly-background'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] overflow-hidden selection:bg-[#F97316] selection:text-black">
      {/* PolyBackground */}
      <PolyBackground variant="full" className="opacity-10" />

      {/* Decorative Giant Background Typography - Slow Rotating */}
      <motion.div
        className="fixed top-1/2 left-1/2 z-0 select-none pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{
          duration: 7200,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ x: '-50%', y: '-50%' }}
      >
        <h1 className="text-[#1A1A1A] font-black text-[25vw] leading-none tracking-tighter whitespace-nowrap">
          404
        </h1>
      </motion.div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-transparent">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tighter text-[#F97316] uppercase"
        >
          Jnana Sethu
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <span className="text-white/40 text-[10px] uppercase tracking-widest font-light">
            Error Protocol 404
          </span>
        </div>
      </nav>

      {/* Foreground Content */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          className="space-y-4 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Breadcrumb / Label */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="h-px w-8 bg-[#584237] opacity-30" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#F97316] font-medium">
              Path Obstruction
            </span>
            <span className="h-px w-8 bg-[#584237] opacity-30" />
          </div>

          <h2 className="text-white font-black text-5xl md:text-7xl tracking-tighter">
            Lost on the map.
          </h2>
          <p className="text-[#A0A0A0] font-light text-xl md:text-3xl tracking-tight">
            This road doesn&apos;t exist.
          </p>

          <div className="pt-4 flex flex-col items-center">
            <p className="text-[#555] text-sm max-w-xs leading-relaxed font-light mb-10">
              The page you&apos;re looking for isn&apos;t on any of our roads.
              Head back and keep exploring the celestial architecture.
            </p>

            {/* Action Cluster */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/"
                className="group flex items-center justify-center gap-3 px-8 py-4 border border-[#333] text-[#A0A0A0] transition-all duration-300 hover:border-[#F97316] hover:text-[#F97316] hover:scale-[1.02] active:scale-[0.98] rounded-sm"
              >
                <span className="text-sm">←</span>
                <span className="text-xs uppercase tracking-widest font-bold">
                  Go Home
                </span>
              </Link>
              <Link
                href="/world"
                className="flex items-center justify-center gap-3 px-10 py-4 bg-[#F97316] text-black transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] rounded-sm shadow-xl shadow-[#F97316]/10"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                <span className="text-xs uppercase tracking-widest font-black">
                  Open the Map
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer Archive Info */}
      <footer className="fixed bottom-0 left-0 w-full z-40 px-12 py-8 flex flex-col md:flex-row justify-between items-center bg-transparent pointer-events-none opacity-40">
        <div className="font-light text-[10px] uppercase tracking-widest text-white/30">
          © 2024 Jnana Sethu Archive
        </div>
        <div className="hidden md:flex gap-6 font-light text-[10px] uppercase tracking-widest text-white/30">
          <span>Terminal: 0x404</span>
          <span>Coord: 0,0,0</span>
        </div>
      </footer>

      {/* Decorative Scroll Indicator */}
      <div className="fixed bottom-12 right-12 z-50 pointer-events-none">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.svg
            className="absolute inset-0 w-full h-full opacity-20"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{
              duration: 7200,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#F97316"
              strokeWidth="0.5"
              strokeDasharray="4 8"
            />
          </motion.svg>
          <svg
            className="text-[#F97316] opacity-60"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M4 10h16" />
            <path d="M10 4v16" />
          </svg>
        </div>
      </div>
    </div>
  )
}
