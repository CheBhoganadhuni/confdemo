Build the /world page for Jnana Sethu. Dark theme throughout.
This is the spatial learning map — every city, level, and component visible and explorable.
Visual reference: Naruto world map meets Civilization VI strategic view.
Three drill-down states: World → City (zoom in) → Level (sheet) → Components (modal).

MIDDLEWARE: /world requires authentication. Non-auth → redirect to /.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE: app/(main)/world/page.tsx (server component)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fetch from Supabase:
  - All published cities with their level counts and estimated hours
  - All published levels grouped by city
  - Current user's completed component IDs (from user_component_progress where status=completed)
  - Per-city completion percentage for this user
  - Per-level completion percentage
  - University-scoped city activity counts (students currently active per city)

Pass to <WorldMapClient /> client component.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE: components/world/WorldMapClient.tsx ('use client')
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

State: { view: 'world' | 'city', selectedCity: City | null, selectedLevel: Level | null }
Full screen. bg-[#0A0A0A]. Overflow hidden.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIEW 1: WORLD MAP (view === 'world')
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top bar (fixed, z-50, bg-[#0A0A0A]/80 backdrop-blur, border-b border-[#1F1F1F], h-14 px-6):
  Left: "← Home" link in text-[#555] hover:text-white text-sm
  Center: "World Map" text-white font-bold text-sm
  Right: search input (small, dark) for filtering cities — client-side instant filter

Map canvas container:
  Full viewport minus top bar. bg-[#0D0D0D].
  Background: subtle hex/topographic SVG pattern at opacity 0.04 (like graph paper but darker)
  Cities are absolutely positioned using a fixed coordinate map.

CITY POSITIONS (use these exact percentage-based coordinates):
  beginners-picnic:   left: 12%, top: 65%
  blueprint-factory:  left: 22%, top: 30%
  algorithmic-jungle: left: 40%, top: 20%
  control-tower:      left: 60%, top: 15%
  signal-city:        left: 75%, top: 35%
  data-vault:         left: 55%, top: 55%
  engine-room:        left: 30%, top: 60%
  api-district:       left: 48%, top: 72%
  cloud-deck:         left: 68%, top: 68%
  git-garage:         left: 82%, top: 55%

Connecting lines (SVG layer, absolutely positioned, full canvas, z-index 1):
  Thin lines connecting related cities. stroke="#F97316" opacity="0.12" strokeWidth="1"
  strokeDasharray="4 6". Draw these connections:
  beginners-picnic → blueprint-factory
  beginners-picnic → engine-room
  blueprint-factory → algorithmic-jungle
  algorithmic-jungle → control-tower
  control-tower → signal-city
  engine-room → data-vault
  data-vault → api-district
  api-district → cloud-deck
  cloud-deck → git-garage
  signal-city → data-vault (cross connection)
  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE: components/world/CityNode.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Props: city, completionPercent, activeStudentCount, onClick

Base size: 72px × 72px (rounded-full) for most cities.
Large cities (algorithmic-jungle, data-vault: 88px).
Small cities (git-garage: 60px).

Outer ring: SVG circle, stroke in city.color, strokeWidth 2, 
  strokeDasharray that represents completion % (circumference calculation).
  Completed portion: solid stroke in city.color.
  Incomplete portion: stroke="#222" dashed.

Inner circle fill:
  0% complete: bg-[#111] with city icon in city.color at 60% opacity
  1-99% complete: bg-[#161616] with city icon in city.color
  100% complete: slight bg tint in city.color at 15% opacity, icon full opacity, golden outer glow

City icon: Lucide icon matching city.icon field. 24px. Centered.

Labels below node (text-center mt-2):
  City title: text-xs font-semibold text-white truncate max-w-20
  Completion: text-[10px] text-[#555] "X% done"
  Active count (if > 0): text-[10px] text-[#F97316] "X here" with Zap icon 8px

Hover state (framer-motion whileHover scale 1.08, duration 0.15):
  Tooltip appears above: dark pill bg-[#111] border border-[#1F1F1F] rounded-sm px-3 py-2:
    City name bold white, level count grey, hours grey, completion %

Click → calls onCityClick

Panning:
  The map canvas supports mouse drag to pan. Use onMouseDown/onMouseMove on the container.
  Track isDragging state. On drag: translate the inner map div.
  On click without drag: trigger city click.
  Touch support: onTouchStart/onTouchMove for mobile.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VIEW 2: CITY DRILL-DOWN (view === 'city')
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When city is clicked:
  framer-motion AnimatePresence: the world map fades/scales out (opacity 0, scale 0.96)
  City view fades/scales in (opacity 1, scale 1.02 → 1) — 300ms

City view layout:
  Left panel (320px, border-r border-[#1F1F1F], overflow-y-auto, bg-[#0A0A0A]):
    Back button: "← World Map" text-[#F97316] hover:text-white text-sm px-6 pt-6 pb-4
    City header:
      City icon (Lucide, 32px) in city.color
      City title font-bold text-white text-2xl tracking-tight mt-2
      Difficulty badge + hours pill (small, dark bg, grey text)
      Completion bar: thin progress bar in city.color, full width
      "X of Y levels complete" text-[#555] text-xs mt-1
      "X students from your college here" text-[#F97316] text-xs if count > 0
    
    Levels list (mt-6, px-6):
      Each level row (py-4 border-b border-[#1A1A1A] cursor-pointer hover:bg-[#111]
        group transition-colors):
        Left: status dot (12px circle) — #333 if 0%, city.color ring pulse if available,
          half-filled if in_progress, solid city.color if 100%
        Center:
          Level title text-white text-sm font-medium group-hover:text-[#F97316] transition-colors
          "~Xh" text-[#555] text-xs
          If 90%+ complete: "1 topic left" in text-[#F97316] text-[10px]
        Right: ChevronRight in #333 group-hover:#F97316 16px

      Clicking level → opens LevelSheet

  Right panel (flex-1, relative, overflow-hidden):
    Background: subtle city-colored radial gradient at 5% opacity in corner
    PolyBackground variant="corner-right" in city.color at reduced opacity
    
    Center content (if no level selected):
      City icon large (64px) in city.color
      City description text-[#A0A0A0] text-lg max-w-md text-center
      Estimated hours + level count stats
      "Select a level to begin" text-[#555] text-sm mt-4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE: components/world/LevelSheet.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

shadcn Sheet. side="right" desktop (w-[440px]), side="bottom" mobile (h-[80vh]).
Background: #111111. Border-left: 1px solid #1F1F1F.

Fetch on open: GET /api/level/[slug]/components (returns components + resources + user progress)

Header (p-6 border-b border-[#1F1F1F]):
  Level icon (Lucide) + title font-bold text-white text-xl
  Difficulty + "~Xh remaining" text-[#A0A0A0] text-sm mt-1
  Progress bar (thin, level.color, mt-3): "X / Y topics"

Component list (overflow-y-auto, max-h of remaining space):
  Each component row (px-6 py-4 border-b border-[#1A1A1A] cursor-pointer
    hover:bg-[#161616] transition-colors):

    COLLAPSED:
      Status circle 10px: #333 = locked, #F97316 = available, 
        level.color = completed (filled), amber = in_progress
      Title text-white text-sm font-medium ml-3
      Duration pill text-[#555] text-xs ml-auto
      ChevronDown → ChevronUp when expanded

    EXPANDED (AnimatePresence height animation):
      Component description text-[#777] text-sm mb-4
      
      "Resources" label text-[10px] tracking-wider text-[#F97316] uppercase mb-3
      Resource cards (each):
        bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-3 mb-2
        Left: type icon (PlayCircle/FileText/BookOpen/Grid in #A0A0A0) 
        Center: resource title text-white text-xs / provider text-[#555] text-[10px]
          / duration text-[#555] text-[10px]
        Right: "Open →" button text-[#F97316] text-xs hover:underline → opens url in new tab

      Cross-links section (if any):
        "Also appears in:" text-[10px] text-[#555] uppercase tracking-wider mb-2
        Pills: border border-[#333] text-[#A0A0A0] text-xs rounded-sm px-2 py-1 mr-1

      Mark Complete button (mt-4, w-full, h-10):
        If not completed: bg-[#F97316] hover:bg-[#EA6B0A] text-black font-bold rounded-sm
          → POST /api/progress/complete, update local state
        If completed: bg-[#1A1A1A] text-[#555] border border-[#333] disabled cursor-default
          "Completed ✓"
      
      On complete: brief framer-motion celebration — status circle fills with level.color,
        scale bounce 1→1.2→1, component row gets a subtle level.color left-border highlight.