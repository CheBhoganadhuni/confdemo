'use client'

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]">
      <div className="relative flex items-center justify-center">
        {/* Outer orange ping ring */}
        <div
          className="absolute size-36 rounded-full border border-[#F97316]/25 animate-ping"
          style={{ animationDuration: '2.4s' }}
        />
        {/* Inner subtle ring */}
        <div
          className="absolute size-28 rounded-full border border-[#F97316]/10 animate-ping"
          style={{ animationDuration: '2.4s', animationDelay: '0.4s' }}
        />
        {/* Logo circle — same style as sign-in modal */}
        <div
          className="relative size-24 rounded-full overflow-hidden ring-1 ring-[#2a2a2a] shadow-lg shadow-black/60"
          style={{ animation: 'js-breathe 2.4s ease-in-out infinite' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Jnana Sethu" className="size-full object-cover" />
        </div>
      </div>

      <style>{`
        @keyframes js-breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(0.94); }
        }
      `}</style>
    </div>
  )
}
