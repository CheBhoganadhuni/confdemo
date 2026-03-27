'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { AnimatedGeometry } from '@/components/ui/AnimatedGeometry'
import { OrangeScrollIndicator } from '@/components/ui/orange-scroll-indicator'
import { SignInModal } from '@/components/auth/sign-in-modal'
import { AuthErrorToast } from '@/components/auth/AuthErrorToast'
import { ArrowRight, Map, Route, User, Zap, Lock } from 'lucide-react'

function FadeInSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Feature cards data ─────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    id: 'world',
    route: '/world',
    tag: 'EXPLORE',
    title: 'World Map',
    subtitle: 'Every subject as a city. Every skill as a level.',
    description:
      'Navigate 10 themed cities across your 4-year curriculum. Discover what to learn, in what order, with hand-picked resources at every step.',
    accent: '#10B981',
    stats: ['10 Cities', '32 Levels', '200+ Resources'],
    Icon: Map,
    comingSoon: false,
  },
  {
    id: 'road',
    route: '/road',
    tag: 'BUILD',
    title: 'Custom Roads',
    subtitle: 'Your path, your pace.',
    description:
      'Pick components from any city and build a personalized learning road. DSA + Backend? Systems + ML? You decide — we track all progress.',
    accent: '#F97316',
    stats: ['Any combination', 'Full progress tracking', 'Bolt rewards'],
    Icon: Route,
    comingSoon: false,
  },
  {
    id: 'profile',
    route: '/profile',
    tag: 'TRACK',
    title: 'Player Profile',
    subtitle: 'See exactly what you\'ve mastered.',
    description:
      'Daily tasks earn bolts. Levels build your skill tree. Your profile shows what you actually learned — not just what you enrolled in.',
    accent: '#3B82F6',
    stats: ['Daily tasks', 'Skill tree', 'XP system'],
    Icon: User,
    comingSoon: false,
  },
  {
    id: 'premium',
    route: null,
    tag: 'COMING SOON',
    title: 'Premium',
    subtitle: 'Quizzes, mock interviews, AI tutor.',
    description:
      'Everything that exists today stays free — forever. Premium adds extra tools at reasonable student pricing. Early users get priority access.',
    accent: '#8B5CF6',
    stats: ['Practice quizzes', 'Mock interviews', 'AI tutor'],
    Icon: Lock,
    comingSoon: true,
  },
]

function FeatureCards() {
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = (idx: number) => {
    setDirection(idx > active ? 1 : -1)
    setActive(idx)
  }

  // Auto-advance
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      const next = (active + 1) % FEATURE_CARDS.length
      setDirection(1)
      setActive(next)
    }, 4500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [active])

  const card = FEATURE_CARDS[active]

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <div>
      {/* Card */}
      <div
        className="relative rounded-sm border overflow-hidden"
        style={{ borderColor: `${card.accent}22` }}
      >
        {/* Accent glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 70% 30%, ${card.accent}14 0%, transparent 60%)`,
          }}
        />

        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={card.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid grid-cols-1 md:grid-cols-2 min-h-[280px] sm:min-h-[320px]"
          >
            {/* Left: text */}
            <div className="p-7 sm:p-10 flex flex-col justify-between">
              <div>
                <span
                  className="text-[10px] tracking-[0.2em] font-semibold"
                  style={{ color: card.accent }}
                >
                  {card.tag}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 mb-3">
                  {card.title}
                </h3>
                <p className="text-[#A0A0A0] text-xs mb-4">{card.subtitle}</p>
                <p className="text-[#666] text-sm leading-relaxed">{card.description}</p>
              </div>

              <div className="flex items-center gap-3 mt-6 flex-wrap">
                {card.stats.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-2.5 py-1 rounded-sm font-medium"
                    style={{
                      backgroundColor: `${card.accent}18`,
                      color: card.accent,
                      border: `1px solid ${card.accent}30`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              {!card.comingSoon && card.route && (
                <Link
                  href={card.route}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold transition-colors"
                  style={{ color: card.accent }}
                >
                  Explore {card.title}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {card.comingSoon && (
                <div className="mt-5 inline-flex items-center gap-2 text-sm text-[#555]">
                  <Lock className="w-3.5 h-3.5" />
                  Coming soon — you&apos;re getting early access
                </div>
              )}
            </div>

            {/* Right: visual */}
            <div
              className="hidden md:flex items-center justify-center p-10 border-l"
              style={{ borderColor: `${card.accent}18` }}
            >
              <div className="relative flex items-center justify-center">
                {/* Large faded icon */}
                <card.Icon
                  className="w-32 h-32 opacity-[0.06]"
                  style={{ color: card.accent }}
                />
                {/* Centered icon */}
                <div
                  className="absolute w-16 h-16 rounded-sm flex items-center justify-center"
                  style={{ backgroundColor: `${card.accent}18`, border: `1px solid ${card.accent}30` }}
                >
                  <card.Icon className="w-7 h-7" style={{ color: card.accent }} />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators + prev/next */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {FEATURE_CARDS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? 24 : 8,
              height: 8,
              backgroundColor: i === active ? FEATURE_CARDS[active].accent : '#333',
            }}
            aria-label={c.title}
          />
        ))}
      </div>

      {/* Card labels */}
      <div className="flex items-center justify-center gap-6 mt-4">
        {FEATURE_CARDS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => goTo(i)}
            className="text-[10px] tracking-widest uppercase transition-colors"
            style={{ color: i === active ? FEATURE_CARDS[i].accent : '#333' }}
          >
            {c.tag}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)

  // Lightweight auth check for button logic (Navbar manages its own display state)
  useEffect(() => {
    fetch('/api/user/me')
      .then(res => { if (res.ok) setIsLoggedIn(true) })
      .catch(() => {})
      .finally(() => setAuthChecked(true))
  }, [])

  // Parallax for hero section — spring-smoothed
  const heroRef = useRef(null)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const rawHeroY = useTransform(heroProgress, [0, 1], [0, -80])
  const heroY = useSpring(rawHeroY, { stiffness: 100, damping: 30, mass: 0.5 })
  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0])

  // Section 2 parallax
  const section2Ref = useRef(null)
  const { scrollYProgress: sec2Progress } = useScroll({
    target: section2Ref,
    offset: ['start end', 'end start'],
  })
  const sec2Y = useTransform(sec2Progress, [0, 1], [30, -30])

  const section4Ref = useRef(null)

  const handleOpenMap = () => {
    if (isLoggedIn) {
      window.location.href = '/world'
    } else {
      setSignInOpen(true)
    }
  }

  const handleStartFree = () => {
    if (isLoggedIn) {
      window.location.href = '/world'
    } else {
      setSignInOpen(true)
    }
  }

  return (
    <main className="bg-[#0A0A0A]">
      <Navbar />

      {/* ── SECTION 1 — HERO ── */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
        {/* Scroll-reactive animated geometry replaces static PolyBackground */}
        <AnimatedGeometry className="absolute inset-0 w-full h-full" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex items-center min-h-screen pt-14 will-change-transform"
        >
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between w-full gap-8 lg:gap-8">
            {/* Left Column */}
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-5 sm:mb-8"
              >
                <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold">
                  FOR BTECH CSE STUDENTS
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-[clamp(2rem,6vw,5.5rem)] leading-[1.0] tracking-tight"
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
                className="mt-5 sm:mt-8 max-w-md text-[#A0A0A0] text-sm sm:text-lg leading-relaxed"
              >
                We wasted years figuring out what to learn and in what order.
                You don&apos;t have to. This is the map.
              </motion.p>

              {/* CTA — single primary button only */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-6 sm:mt-10"
              >
                <button
                  onClick={handleOpenMap}
                  className="bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold px-8 h-12 rounded-sm transition-colors flex items-center justify-center gap-2"
                >
                  Open the Map
                  <ArrowRight className="w-4 h-4" />
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

            {/* Right Column - Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="w-full lg:w-auto"
            >
              {/* Mobile: horizontal grid */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:hidden">
                {[
                  { number: '2',    label: 'Career Roads' },
                  { number: '10',   label: 'Themed Cities' },
                  { number: '32',   label: 'Skill Levels' },
                  { number: '200+', label: 'Resources' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center py-3 sm:py-4 border border-[#1F1F1F] rounded-sm">
                    <div className="text-xl sm:text-3xl font-black text-white">{stat.number}</div>
                    <div className="text-[7px] sm:text-[9px] tracking-widest uppercase text-[#555] mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: vertical aligned right */}
              <div className="hidden lg:flex flex-col items-end justify-center">
                {[
                  { number: '2',    label: 'Career Roads' },
                  { number: '10',   label: 'Themed Cities' },
                  { number: '32',   label: 'Skill Levels' },
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
      </section>

      {/* ── SECTION 2 — THE PROBLEM ── */}
      <section id="how-it-works" ref={section2Ref} className="bg-[#F5F5F3] py-14 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-24">
            {/* Left - Sticky */}
            <FadeInSection className="lg:sticky lg:top-32 lg:self-start lg:w-1/3">
              <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold mb-4 sm:mb-6 block">
                THE PROBLEM
              </span>
              <h2 className="text-[clamp(1.6rem,4vw,3.5rem)] tracking-tight leading-[1.1]">
                <span className="block font-light text-[#888]">Learning is</span>
                <span className="block font-light text-[#888]">broken for</span>
                <span className="block font-black text-[#111]">engineers.</span>
              </h2>
            </FadeInSection>

            {/* Right - Items */}
            <motion.div className="lg:w-2/3 flex flex-col" style={{ y: sec2Y }}>
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
                  className={`relative group pl-4 overflow-hidden cursor-default py-5 sm:py-8 transition-all duration-300 ${
                    index !== 2 ? 'border-b border-[#D5D5D3]' : ''
                  }`}
                >
                  {/* Animated left-border accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F97316] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top rounded-full" />
                  <span className="font-mono text-xs text-[#F97316] mb-2 sm:mb-3 block">{item.num}</span>
                  <h3 className="font-bold text-[#111] text-base sm:text-xl mb-1.5 sm:mb-2 group-hover:text-[#F97316] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-[#666] text-sm sm:text-base">{item.desc}</p>
                </FadeInSection>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — THE SOLUTION ── */}
      <section id="section-solution" className="relative bg-[#0A0A0A] py-14 sm:py-32 overflow-hidden">
        {/* Scroll-reactive animated geometry */}
        <AnimatedGeometry className="absolute inset-0 w-full h-full" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <FadeInSection>
            <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold mb-5 sm:mb-8 block text-center">
              THE SOLUTION
            </span>
            <h2 className="text-[clamp(1.8rem,5vw,4.5rem)] tracking-tight text-center leading-[1.1]">
              <span className="block font-black text-white">The map.</span>
              <span className="block font-light text-[#A0A0A0]">The resources.</span>
              <span className="block font-black text-white">The proof.</span>
            </h2>
          </FadeInSection>

          <div className="mt-10 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-px">
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
                className={`relative group overflow-hidden cursor-default transition-all duration-300 px-4 sm:px-6 py-5 sm:py-8 ${
                  index !== 0 ? 'md:border-l md:border-[#1F1F1F]' : ''
                } ${
                  index !== 2 ? 'border-b md:border-b-0 border-[#1F1F1F]' : ''
                }`}
              >
                {/* Animated left-border accent */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F97316] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top rounded-full" />
                <span className="text-xs font-mono text-[#F97316] mb-2 sm:mb-4 block">{col.num}</span>
                <h3 className="font-bold text-white text-base sm:text-xl mb-1.5 sm:mb-3 group-hover:text-[#F97316] transition-colors duration-300">
                  {col.title}
                </h3>
                <p className="text-[#A0A0A0] text-sm leading-relaxed">{col.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — FEATURE CARDS ── */}
      <section id="section-glimpse" ref={section4Ref} className="bg-[#0A0A0A] py-14 sm:py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeInSection>
            <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold mb-4 block">
              WHAT&apos;S INSIDE
            </span>
            <h2 className="text-2xl sm:text-4xl tracking-tight mb-10 sm:mb-14">
              <span className="font-light text-[#A0A0A0]">Four pillars.</span>
              <span className="font-black text-white"> One platform.</span>
            </h2>
          </FadeInSection>

          <FeatureCards />
        </div>
      </section>

      {/* ── SECTION 5 — AUTH HOOK — hidden for signed-in users ── */}
      {(!authChecked || !isLoggedIn) && (
        <section id="section-cta" className="relative bg-[#0A0A0A] py-16 sm:py-32 overflow-hidden">
          <AnimatedGeometry className="absolute inset-0 w-full h-full" />

          <FadeInSection className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-5xl tracking-tight mb-3 sm:mb-6">
              <span className="block font-light text-[#A0A0A0]">Ready to stop</span>
              <span className="block font-black text-white">guessing?</span>
            </h2>
            <p className="text-[#A0A0A0] mb-6 sm:mb-10 text-sm sm:text-base">
              Jnana Sethu is free for all students at partnered universities.
            </p>
            <button
              onClick={handleStartFree}
              className="bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold px-8 sm:px-12 h-12 sm:h-14 rounded-sm text-sm sm:text-base transition-colors inline-flex items-center gap-2"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[#555] text-xs mt-4">
              No signup form. Just your college Google account.
            </p>
          </FadeInSection>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer id="section-footer" className="bg-[#0A0A0A] border-t border-[#1F1F1F] py-7 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Mobile: brand full-width, then 2-col grid for links + partnerships */}
          {/* Desktop: single flex row with 3 columns */}
          <div className="flex flex-col gap-5 lg:flex-row lg:justify-between lg:items-start lg:gap-8">

            {/* Brand */}
            <div className="max-w-xs">
              <div className="font-bold text-white text-base tracking-tight mb-1">
                Jnana Sethu<span className="text-[#F97316]">.</span>
              </div>
              <p className="text-[#555] text-sm leading-relaxed">
                Structured learning paths built by seniors, for juniors.
              </p>
            </div>

            {/* Mobile 2-col: explore + partnerships side by side */}
            <div className="grid grid-cols-2 gap-4 lg:contents">

              {/* Nav links */}
              <div>
                <span className="text-[10px] tracking-widest text-[#555] uppercase mb-2.5 block">Explore</span>
                <ul className="flex flex-col gap-2">
                  {[
                    { href: '/world',   label: 'World Map' },
                    { href: '/road',    label: 'Roads' },
                    { href: '/profile', label: 'My Profile' },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-[#A0A0A0] text-sm hover:text-[#F97316] transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Partnership */}
              <div>
                <span className="text-[10px] tracking-widest text-[#555] uppercase mb-2.5 block">Partnerships</span>
                <p className="text-[#A0A0A0] text-sm leading-relaxed mb-3">
                  Bring Jnana Sethu to your university. Free for students.
                </p>
                <a
                  href="mailto:partnerships@jnanasethu.com"
                  className="inline-flex items-center gap-2 bg-transparent border border-[#333] hover:border-[#F97316] text-white hover:text-[#F97316] text-xs sm:text-sm px-3 py-2 rounded-sm transition-colors break-all"
                >
                  partnerships@jnanasethu.com
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </a>
              </div>

            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[#1F1F1F] mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <p className="text-[#444] text-xs">
              © {new Date().getFullYear()} Jnana Sethu. Made with ♥ by students, for students.
            </p>
            <p className="text-[#333] text-xs">
              Free for all students at partnered universities.
            </p>
          </div>

        </div>
      </footer>

      {/* ── FIXED SCROLL INDICATOR — desktop/tablet only ── */}
      <div className="fixed bottom-8 right-8 z-50 hidden md:flex">
        <OrangeScrollIndicator
          sectionIds={['how-it-works', 'section-solution', 'section-glimpse', 'section-cta', 'section-footer']}
        />
      </div>

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />

      <Suspense fallback={null}>
        <AuthErrorToast />
      </Suspense>
    </main>
  )
}
