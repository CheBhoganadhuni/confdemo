'use client'

import { useState, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Navbar } from '@/components/layout/navbar'
import { PolyBackground } from '@/components/ui/poly-background'
import { OrangeScrollIndicator } from '@/components/ui/orange-scroll-indicator'
import { SignInModal } from '@/components/auth/sign-in-modal'
import { ArrowRight } from 'lucide-react'

function FadeInSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)

  // Parallax for hero section
  const heroRef = useRef(null)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(heroProgress, [0, 1], [0, -80])
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0])

  const handleSignOut = () => setUser(null)

  const handleOpenMap = () => {
    if (user) {
      window.location.href = '/world'
    } else {
      setSignInOpen(true)
    }
  }

  const handleStartFree = () => {
    if (user) {
      window.location.href = '/world'
    } else {
      setSignInOpen(true)
    }
  }

  return (
    <main className="bg-[#0A0A0A]">
      <Navbar
        user={user}
        studyTime="0h 24m"
        bolts={7}
        onSignOut={handleSignOut}
      />

      {/* SECTION 1 — HERO */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
        <PolyBackground variant="corner-right" className="text-white" scrollReactive />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex items-center min-h-screen pt-14"
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between w-full gap-8 lg:gap-8">
            {/* Left Column */}
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-6 sm:mb-8"
              >
                <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold">
                  FOR BTECH CSE STUDENTS
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-[clamp(2.2rem,6vw,5.5rem)] leading-[1.0] tracking-tight"
              >
                <span className="block font-light text-[#A0A0A0]">Your 4-year</span>
                <span className="block font-black text-white">BTech roadmap,</span>
                <span className="block font-light text-[#A0A0A0]">built by the ones</span>
                <span className="block font-black text-white">who finished it.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-6 sm:mt-8 max-w-md text-[#A0A0A0] text-base sm:text-lg leading-relaxed"
              >
                We wasted years figuring out what to learn and in what order.
                You don&apos;t have to. This is the map.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <button
                  onClick={handleOpenMap}
                  className="bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold px-8 h-12 rounded-sm transition-colors flex items-center justify-center gap-2"
                >
                  Open the Map
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="border border-[#333] text-[#A0A0A0] hover:border-[#F97316] hover:text-white px-8 h-12 rounded-sm transition-colors"
                >
                  How it works
                </button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-4 text-[#555] text-xs"
              >
                100% free. No credit card. Backed by students who&apos;ve been there.
              </motion.p>
            </div>

            {/* Right Column - Stats (desktop: vertical stack, mobile: horizontal grid) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="w-full lg:w-auto"
            >
              {/* Mobile: horizontal grid */}
              <div className="grid grid-cols-4 gap-3 lg:hidden">
                {[
                  { number: '2', label: 'Career Roads' },
                  { number: '10', label: 'Themed Cities' },
                  { number: '32', label: 'Skill Levels' },
                  { number: '200+', label: 'Resources' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center py-4 border border-[#1F1F1F] rounded-sm">
                    <div className="text-2xl sm:text-3xl font-black text-white">{stat.number}</div>
                    <div className="text-[8px] sm:text-[9px] tracking-widest uppercase text-[#555] mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: vertical aligned right */}
              <div className="hidden lg:flex flex-col items-end justify-center">
                {[
                  { number: '2', label: 'Career Roads' },
                  { number: '10', label: 'Themed Cities' },
                  { number: '32', label: 'Skill Levels' },
                  { number: '200+', label: 'Resources' },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`py-6 text-right ${index !== 0 ? 'border-t border-[#1F1F1F]' : ''} w-48`}
                  >
                    <div className="text-5xl font-black text-white">{stat.number}</div>
                    <div className="text-[10px] tracking-widest uppercase text-[#555] mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 right-4 sm:bottom-8 sm:right-8">
          <OrangeScrollIndicator targetId="how-it-works" />
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM */}
      <section id="how-it-works" className="bg-[#F5F5F3] py-16 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-24">
            {/* Left - Sticky */}
            <FadeInSection className="lg:sticky lg:top-32 lg:self-start lg:w-1/3">
              <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold mb-4 sm:mb-6 block">
                THE PROBLEM
              </span>
              <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] tracking-tight leading-[1.1]">
                <span className="block font-light text-[#888]">Learning is</span>
                <span className="block font-light text-[#888]">broken for</span>
                <span className="block font-black text-[#111]">engineers.</span>
              </h2>
            </FadeInSection>

            {/* Right - Items */}
            <div className="lg:w-2/3 flex flex-col">
              {[
                {
                  num: '01',
                  title: 'Too many resources',
                  desc: '400 Python playlists. Which one? Nobody told you.',
                },
                {
                  num: '02',
                  title: 'No structure',
                  desc: 'You learn React before JavaScript. Things fall apart.',
                },
                {
                  num: '03',
                  title: 'No one to ask',
                  desc: "Seniors who figured it out are in Bangalore now. Their knowledge left with them.",
                },
              ].map((item, index) => (
                <FadeInSection
                  key={item.num}
                  delay={index * 0.1}
                  className={`py-6 sm:py-8 ${index !== 2 ? 'border-b border-[#D5D5D3]' : ''}`}
                >
                  <span className="font-mono text-xs text-[#F97316] mb-2 sm:mb-3 block">{item.num}</span>
                  <h3 className="font-bold text-[#111] text-lg sm:text-xl mb-2">{item.title}</h3>
                  <p className="text-[#666] text-sm sm:text-base">{item.desc}</p>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — THE SOLUTION */}
      <section className="relative bg-[#0A0A0A] py-16 sm:py-32 overflow-hidden">
        <PolyBackground variant="corner-left" className="text-white" scrollReactive />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <FadeInSection>
            <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold mb-6 sm:mb-8 block text-center">
              THE SOLUTION
            </span>
            <h2 className="text-[clamp(2rem,5vw,4.5rem)] tracking-tight text-center leading-[1.1]">
              <span className="block font-black text-white">The map.</span>
              <span className="block font-light text-[#A0A0A0]">The resources.</span>
              <span className="block font-black text-white">The proof.</span>
            </h2>
          </FadeInSection>

          <div className="mt-12 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-px">
            {[
              {
                num: '01',
                title: 'Curated by seniors',
                desc: "Every resource chosen by someone who walked this exact path. No more guessing which playlist, which channel, which order.",
              },
              {
                num: '02',
                title: 'Your path, your pace',
                desc: 'Switch between DSA, Backend, Systems at any time. Build your own road. We track all progress everywhere.',
              },
              {
                num: '03',
                title: 'Prove what you know',
                desc: "Complete checkpoints. Earn XP. Build a skill profile that shows employers what you actually learned — not just certificates.",
              },
            ].map((col, index) => (
              <FadeInSection
                key={col.num}
                delay={index * 0.12}
                className={`px-4 sm:px-6 py-6 sm:py-8 ${index !== 0 ? 'md:border-l md:border-[#1F1F1F]' : ''} ${index !== 2 ? 'border-b md:border-b-0 border-[#1F1F1F]' : ''}`}
              >
                <span className="text-xs font-mono text-[#F97316] mb-3 sm:mb-4 block">{col.num}</span>
                <h3 className="font-bold text-white text-lg sm:text-xl mb-2 sm:mb-3">{col.title}</h3>
                <p className="text-[#A0A0A0] text-sm leading-relaxed">{col.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — THE PRODUCT GLIMPSE */}
      <section className="bg-[#0F0F0F] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl tracking-tight text-center mb-4 sm:mb-6">
              <span className="font-light text-[#A0A0A0]">See</span>
              <span className="font-black text-white"> everything</span>
              <br />
              <span className="font-light text-[#A0A0A0]">at once.</span>
            </h2>
            <p className="text-center text-[#555] mb-8 sm:mb-12 max-w-lg mx-auto text-sm sm:text-base">
              Every city, every level, every resource — mapped and navigable.
              Your entire 4-year syllabus, visualized.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <div className="rounded-lg border border-[#222] overflow-hidden">
              <div className="bg-[#161616] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF5F56]" />
                  <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                  <div className="w-2 h-2 rounded-full bg-[#27CA40]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#0A0A0A] rounded-sm px-3 sm:px-4 py-1 text-[10px] sm:text-xs text-[#555]">
                    jnanasethu.com/world
                  </div>
                </div>
              </div>
              <div className="bg-[#0A0A0A] aspect-video flex flex-col items-center justify-center p-6 sm:p-8">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">/world — The Learning Map</div>
                <p className="text-[#555] text-xs sm:text-sm">Explore 10 cities, 32 levels, 200+ resources</p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* SECTION 5 — AUTH HOOK */}
      <section className="relative bg-[#0A0A0A] py-20 sm:py-32 overflow-hidden">
        <PolyBackground variant="full" className="text-white opacity-50" scrollReactive />

        <FadeInSection className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl tracking-tight mb-4 sm:mb-6">
            <span className="block font-light text-[#A0A0A0]">Ready to stop</span>
            <span className="block font-black text-white">guessing?</span>
          </h2>
          <p className="text-[#A0A0A0] mb-8 sm:mb-10 text-sm sm:text-base">
            Jnana Sethu is free for all students at partnered universities.
          </p>
          <button
            onClick={handleStartFree}
            className="bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold px-10 sm:px-12 h-12 sm:h-14 rounded-sm text-sm sm:text-base transition-colors inline-flex items-center gap-2"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[#555] text-xs mt-4">
            No signup form. Just your college Google account.
          </p>
        </FadeInSection>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0A] border-t border-[#1F1F1F] py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:gap-12 lg:flex-row lg:justify-between">
            {/* Left */}
            <div>
              <div className="font-bold text-white text-lg tracking-tight">
                Jnana Sethu<span className="text-[#F97316]">.</span>
              </div>
              <p className="text-[#555] text-sm mt-2">
                A bridge of knowledge — from seniors to juniors.
              </p>
              <a
                href="mailto:contact@jnanasethu.com"
                className="text-[#F97316] text-sm mt-4 inline-block hover:underline"
              >
                contact@jnanasethu.com
              </a>
            </div>

            {/* Right */}
            <div>
              <span className="text-[10px] tracking-widest text-[#555] uppercase mb-3 block">
                Reach us
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                }}
                className="flex"
              >
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-[#111] border border-[#222] rounded-l-sm px-3 sm:px-4 h-11 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#F97316] w-44 sm:w-48 md:w-64"
                />
                <button
                  type="submit"
                  className="bg-[#F97316] hover:bg-[#EA6B0A] px-4 h-11 rounded-r-sm transition-colors flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </form>
              <p className="text-[#555] text-xs mt-3">
                University partnerships? Email us.
              </p>
            </div>
          </div>
        </div>
      </footer>

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </main>
  )
}
