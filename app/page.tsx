'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { PolyBackground } from '@/components/ui/poly-background'
import { OrangeScrollIndicator } from '@/components/ui/orange-scroll-indicator'
import { SignInModal } from '@/components/auth/sign-in-modal'
import { ArrowRight } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  suspended: 'Your university access is currently suspended.',
  not_registered: "Your email isn't registered. Ask your faculty to add you.",
  use_login: 'Use the Sign In button to access your existing account.',
  auth_failed: 'Authentication failed. Please try again.',
}

function HomeContent() {
  const searchParams = useSearchParams()
  // Demo: toggle between logged in and logged out states
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  // Handle error params from auth callback
  useEffect(() => {
    const error = searchParams.get('error')
    if (error && ERROR_MESSAGES[error]) {
      setErrorToast(ERROR_MESSAGES[error])
      // Clear the error param from URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.pathname)
    }
  }, [searchParams])

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => {
        setErrorToast(null)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [errorToast])

  const handleSignOut = () => {
    setUser(null)
  }

  const handleOpenMap = () => {
    if (user) {
      // Navigate to /world
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
      <section className="relative min-h-screen overflow-hidden bg-[#0A0A0A]">
        <PolyBackground variant="corner-right" className="text-white" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 flex items-center min-h-screen pt-14">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between w-full gap-12 lg:gap-8">
            {/* Left Column */}
            <div className="max-w-xl">
              {/* Small Label */}
              <div className="mb-8">
                <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold">
                  FOR BTECH CSE STUDENTS
                </span>
              </div>

              {/* Headline - Bold/Thin Mix */}
              <h1 className="text-[clamp(3rem,6vw,5.5rem)] leading-[1.0] tracking-tight">
                <span className="block font-light text-[#A0A0A0]">Your 4-year</span>
                <span className="block font-black text-white">BTech roadmap,</span>
                <span className="block font-light text-[#A0A0A0]">built by the ones</span>
                <span className="block font-black text-white">who finished it.</span>
              </h1>

              {/* Subtext */}
              <p className="mt-8 max-w-md text-[#A0A0A0] text-lg leading-relaxed">
                We wasted years figuring out what to learn and in what order.
                You don&apos;t have to. This is the map.
              </p>

              {/* CTA Row */}
              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={handleOpenMap}
                  className="bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold px-8 h-12 rounded-sm transition-colors flex items-center gap-2"
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
              </div>

              {/* Below CTA */}
              <p className="mt-4 text-[#555] text-xs">
                100% free. No credit card. Backed by students who&apos;ve been there.
              </p>
            </div>

            {/* Right Column - Stats */}
            <div className="hidden lg:flex flex-col items-end justify-center flex-1">
              {[
                { number: '2', label: 'Career Roads' },
                { number: '10', label: 'Themed Cities' },
                { number: '32', label: 'Skill Levels' },
                { number: '200+', label: 'Resources' },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={`group relative py-6 pr-4 text-right ${index !== 0 ? 'border-t border-[#1F1F1F]' : ''} w-48 transition-all duration-300 cursor-default`}
                >
                  {/* Orange right bar on hover */}
                  <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#F97316] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                  <div className="text-5xl font-black text-white group-hover:text-[#F97316] transition-colors duration-300">{stat.number}</div>
                  <div className="text-[10px] tracking-widest uppercase text-[#555] mt-1 group-hover:text-[#A0A0A0] transition-colors duration-300">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8">
          <OrangeScrollIndicator targetId="how-it-works" />
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM */}
      <section id="how-it-works" className="bg-[#F5F5F3] py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
            {/* Left - Sticky */}
            <div className="lg:sticky lg:top-32 lg:self-start lg:w-1/3">
              <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold mb-6 block">
                THE PROBLEM
              </span>
              <h2 className="text-[clamp(2rem,4vw,3.5rem)] tracking-tight leading-[1.1]">
                <span className="block font-light text-[#888]">Learning is</span>
                <span className="block font-light text-[#888]">broken for</span>
                <span className="block font-black text-[#111]">engineers.</span>
              </h2>
            </div>

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
                <div
                  key={item.num}
                  className={`group relative py-8 pl-4 -ml-4 transition-all duration-300 ${index !== 2 ? 'border-b border-[#D5D5D3]' : ''}`}
                >
                  {/* Orange left bar on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#F97316] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                  <span className="font-mono text-xs text-[#F97316] mb-3 block">{item.num}</span>
                  <h3 className="font-bold text-[#111] text-xl mb-2 group-hover:text-[#F97316] transition-colors duration-300">{item.title}</h3>
                  <p className="text-[#666] text-base">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — THE SOLUTION */}
      <section className="relative bg-[#0A0A0A] py-32 overflow-hidden">
        <PolyBackground variant="corner-left" className="text-white" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Label */}
          <span className="text-[10px] tracking-[0.2em] text-[#F97316] font-semibold mb-8 block text-center">
            THE SOLUTION
          </span>

          {/* Headline */}
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] tracking-tight text-center leading-[1.1]">
            <span className="block font-black text-white">The map.</span>
            <span className="block font-light text-[#A0A0A0]">The resources.</span>
            <span className="block font-black text-white">The proof.</span>
          </h2>

          {/* 3 Columns */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-px">
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
              <div
                key={col.num}
                className={`group relative px-6 py-8 transition-all duration-300 ${index !== 0 ? 'md:border-l md:border-[#1F1F1F]' : ''} ${index !== 2 ? 'border-b md:border-b-0 border-[#1F1F1F]' : ''}`}
              >
                {/* Orange top bar on hover */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#F97316] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <span className="text-xs font-mono text-[#F97316] mb-4 block">{col.num}</span>
                <h3 className="font-bold text-white text-xl mb-3 group-hover:text-[#F97316] transition-colors duration-300">{col.title}</h3>
                <p className="text-[#A0A0A0] text-sm leading-relaxed">{col.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — THE PRODUCT GLIMPSE */}
      <section className="bg-[#0F0F0F] py-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Heading */}
          <h2 className="text-4xl tracking-tight text-center mb-6">
            <span className="font-light text-[#A0A0A0]">See</span>
            <span className="font-black text-white"> everything</span>
            <br />
            <span className="font-light text-[#A0A0A0]">at once.</span>
          </h2>

          {/* Subtext */}
          <p className="text-center text-[#555] mb-12 max-w-lg mx-auto">
            Every city, every level, every resource — mapped and navigable.
            Your entire 4-year syllabus, visualized.
          </p>

          {/* Browser Frame Mockup */}
          <div className="rounded-lg border border-[#222] overflow-hidden">
            {/* Browser Chrome */}
            <div className="bg-[#161616] px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF5F56]" />
                <div className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                <div className="w-2 h-2 rounded-full bg-[#27CA40]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-[#0A0A0A] rounded-sm px-4 py-1 text-xs text-[#555]">
                  jnanasethu.com/world
                </div>
              </div>
            </div>

            {/* Browser Content Placeholder */}
            <div className="bg-[#0A0A0A] aspect-video flex flex-col items-center justify-center p-8">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">/world — The Learning Map</div>
              <p className="text-[#555] text-sm">Explore 10 cities, 32 levels, 200+ resources</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — AUTH HOOK */}
      <section className="relative bg-[#0A0A0A] py-32 overflow-hidden">
        <PolyBackground variant="full" className="text-white opacity-50" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Headline */}
          <h2 className="text-5xl tracking-tight mb-6">
            <span className="block font-light text-[#A0A0A0]">Ready to stop</span>
            <span className="block font-black text-white">guessing?</span>
          </h2>

          {/* Subtext */}
          <p className="text-[#A0A0A0] mb-10">
            Jnana Sethu is free for all students at partnered universities.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleStartFree}
            className="bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold px-12 h-14 rounded-sm text-base transition-colors inline-flex items-center gap-2"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Below */}
          <p className="text-[#555] text-xs mt-4">
            No signup form. Just your college Google account.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0A] border-t border-[#1F1F1F] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between gap-12">
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
                  className="bg-[#111] border border-[#222] rounded-l-sm px-4 h-11 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#F97316] w-48 md:w-64"
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

      {/* Sign In Modal */}
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#111] border border-[#F97316]/30 text-white text-sm px-4 py-3 rounded-sm flex items-center gap-3">
            <span>{errorToast}</span>
            <button
              onClick={() => setErrorToast(null)}
              className="text-[#555] hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  )
}
