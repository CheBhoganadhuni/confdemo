// Mock data for the /world page
// This will be replaced with Supabase queries when connected

export interface WorldCity {
  id: string
  name: string
  slug: string
  description: string
  themeColor: string
  icon: string
  position: { left: string; top: string }
  size: 'small' | 'normal' | 'large'
  levelCount: number
  estimatedHours: number
  completionPercent: number
  activeUsers: number
}

export interface WorldLevel {
  id: string
  cityId: string
  name: string
  slug: string
  orderIndex: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedMinutes: number
  completionPercent: number
  componentCount: number
}

export interface LevelComponent {
  id: string
  levelId: string
  name: string
  description: string
  orderIndex: number
  completed: boolean
  resources: ComponentResource[]
}

export interface ComponentResource {
  id: string
  title: string
  type: 'video' | 'article' | 'quiz' | 'project' | 'external'
  url: string
  durationMinutes: number | null
}

// City positions matching the design spec
export const MOCK_CITIES: WorldCity[] = [
  {
    id: 'beginners-picnic',
    name: "Beginner's Picnic",
    slug: 'beginners-picnic',
    description: 'Start your journey here. Learn the basics of programming and computational thinking.',
    themeColor: 'var(--city-picnic)',
    icon: '🌳',
    position: { left: '12%', top: '65%' },
    size: 'normal',
    levelCount: 4,
    estimatedHours: 12,
    completionPercent: 75,
    activeUsers: 23,
  },
  {
    id: 'blueprint-factory',
    name: 'Blueprint Factory',
    slug: 'blueprint-factory',
    description: 'Master object-oriented design patterns and software architecture principles.',
    themeColor: 'var(--city-blueprint)',
    icon: '📐',
    position: { left: '22%', top: '30%' },
    size: 'normal',
    levelCount: 5,
    estimatedHours: 18,
    completionPercent: 40,
    activeUsers: 15,
  },
  {
    id: 'algorithmic-jungle',
    name: 'Algorithmic Jungle',
    slug: 'algorithmic-jungle',
    description: 'Navigate through data structures and algorithms. Conquer complexity.',
    themeColor: 'var(--city-jungle)',
    icon: '🌿',
    position: { left: '40%', top: '20%' },
    size: 'large',
    levelCount: 8,
    estimatedHours: 32,
    completionPercent: 25,
    activeUsers: 42,
  },
  {
    id: 'control-tower',
    name: 'Control Tower',
    slug: 'control-tower',
    description: 'Learn operating systems, process management, and system-level programming.',
    themeColor: 'var(--city-tower)',
    icon: '🗼',
    position: { left: '60%', top: '15%' },
    size: 'normal',
    levelCount: 6,
    estimatedHours: 24,
    completionPercent: 0,
    activeUsers: 8,
  },
  {
    id: 'signal-city',
    name: 'Signal City',
    slug: 'signal-city',
    description: 'Dive into digital signal processing, communications, and embedded systems.',
    themeColor: 'var(--city-signal)',
    icon: '📡',
    position: { left: '75%', top: '35%' },
    size: 'normal',
    levelCount: 5,
    estimatedHours: 20,
    completionPercent: 0,
    activeUsers: 5,
  },
  {
    id: 'data-vault',
    name: 'Data Vault',
    slug: 'data-vault',
    description: 'Explore databases, data modeling, and the foundations of data engineering.',
    themeColor: 'var(--city-vault)',
    icon: '🏛️',
    position: { left: '55%', top: '55%' },
    size: 'large',
    levelCount: 7,
    estimatedHours: 28,
    completionPercent: 10,
    activeUsers: 31,
  },
  {
    id: 'engine-room',
    name: 'Engine Room',
    slug: 'engine-room',
    description: 'Build powerful backends. Learn server-side programming and system design.',
    themeColor: 'var(--city-engine)',
    icon: '⚙️',
    position: { left: '30%', top: '60%' },
    size: 'normal',
    levelCount: 6,
    estimatedHours: 22,
    completionPercent: 60,
    activeUsers: 19,
  },
  {
    id: 'api-district',
    name: 'API District',
    slug: 'api-district',
    description: 'Connect systems together. Master REST, GraphQL, and API design.',
    themeColor: 'var(--city-api)',
    icon: '🔌',
    position: { left: '48%', top: '72%' },
    size: 'normal',
    levelCount: 4,
    estimatedHours: 14,
    completionPercent: 35,
    activeUsers: 12,
  },
  {
    id: 'cloud-deck',
    name: 'Cloud Deck',
    slug: 'cloud-deck',
    description: 'Scale to the sky. Learn cloud computing, DevOps, and infrastructure.',
    themeColor: 'var(--city-cloud)',
    icon: '☁️',
    position: { left: '68%', top: '68%' },
    size: 'normal',
    levelCount: 5,
    estimatedHours: 20,
    completionPercent: 0,
    activeUsers: 7,
  },
  {
    id: 'git-garage',
    name: 'Git Garage',
    slug: 'git-garage',
    description: 'Version control mastery. Collaborate like a pro with Git and GitHub.',
    themeColor: 'var(--city-garage)',
    icon: '🔧',
    position: { left: '82%', top: '55%' },
    size: 'small',
    levelCount: 3,
    estimatedHours: 8,
    completionPercent: 100,
    activeUsers: 0,
  },
]

// City connections for the SVG lines
export const CITY_CONNECTIONS: [string, string][] = [
  ['beginners-picnic', 'engine-room'],
  ['beginners-picnic', 'blueprint-factory'],
  ['blueprint-factory', 'algorithmic-jungle'],
  ['algorithmic-jungle', 'control-tower'],
  ['control-tower', 'signal-city'],
  ['algorithmic-jungle', 'data-vault'],
  ['engine-room', 'api-district'],
  ['data-vault', 'api-district'],
  ['data-vault', 'cloud-deck'],
  ['signal-city', 'git-garage'],
  ['cloud-deck', 'git-garage'],
]

// Mock levels for each city
export const MOCK_LEVELS: Record<string, WorldLevel[]> = {
  'beginners-picnic': [
    { id: 'bp-1', cityId: 'beginners-picnic', name: 'Hello World', slug: 'hello-world', orderIndex: 1, difficulty: 'beginner', estimatedMinutes: 60, completionPercent: 100, componentCount: 3 },
    { id: 'bp-2', cityId: 'beginners-picnic', name: 'Variables & Types', slug: 'variables-types', orderIndex: 2, difficulty: 'beginner', estimatedMinutes: 90, completionPercent: 100, componentCount: 4 },
    { id: 'bp-3', cityId: 'beginners-picnic', name: 'Control Flow', slug: 'control-flow', orderIndex: 3, difficulty: 'beginner', estimatedMinutes: 120, completionPercent: 50, componentCount: 5 },
    { id: 'bp-4', cityId: 'beginners-picnic', name: 'Functions', slug: 'functions', orderIndex: 4, difficulty: 'beginner', estimatedMinutes: 150, completionPercent: 0, componentCount: 4 },
  ],
  'algorithmic-jungle': [
    { id: 'aj-1', cityId: 'algorithmic-jungle', name: 'Arrays & Strings', slug: 'arrays-strings', orderIndex: 1, difficulty: 'beginner', estimatedMinutes: 90, completionPercent: 100, componentCount: 5 },
    { id: 'aj-2', cityId: 'algorithmic-jungle', name: 'Linked Lists', slug: 'linked-lists', orderIndex: 2, difficulty: 'intermediate', estimatedMinutes: 120, completionPercent: 60, componentCount: 4 },
    { id: 'aj-3', cityId: 'algorithmic-jungle', name: 'Stacks & Queues', slug: 'stacks-queues', orderIndex: 3, difficulty: 'intermediate', estimatedMinutes: 90, completionPercent: 0, componentCount: 4 },
    { id: 'aj-4', cityId: 'algorithmic-jungle', name: 'Trees', slug: 'trees', orderIndex: 4, difficulty: 'intermediate', estimatedMinutes: 180, completionPercent: 0, componentCount: 6 },
    { id: 'aj-5', cityId: 'algorithmic-jungle', name: 'Graphs', slug: 'graphs', orderIndex: 5, difficulty: 'advanced', estimatedMinutes: 240, completionPercent: 0, componentCount: 7 },
    { id: 'aj-6', cityId: 'algorithmic-jungle', name: 'Sorting', slug: 'sorting', orderIndex: 6, difficulty: 'intermediate', estimatedMinutes: 150, completionPercent: 0, componentCount: 5 },
    { id: 'aj-7', cityId: 'algorithmic-jungle', name: 'Searching', slug: 'searching', orderIndex: 7, difficulty: 'intermediate', estimatedMinutes: 120, completionPercent: 0, componentCount: 4 },
    { id: 'aj-8', cityId: 'algorithmic-jungle', name: 'Dynamic Programming', slug: 'dynamic-programming', orderIndex: 8, difficulty: 'advanced', estimatedMinutes: 300, completionPercent: 0, componentCount: 8 },
  ],
  'data-vault': [
    { id: 'dv-1', cityId: 'data-vault', name: 'SQL Fundamentals', slug: 'sql-fundamentals', orderIndex: 1, difficulty: 'beginner', estimatedMinutes: 90, completionPercent: 100, componentCount: 4 },
    { id: 'dv-2', cityId: 'data-vault', name: 'Data Modeling', slug: 'data-modeling', orderIndex: 2, difficulty: 'intermediate', estimatedMinutes: 120, completionPercent: 0, componentCount: 5 },
    { id: 'dv-3', cityId: 'data-vault', name: 'Normalization', slug: 'normalization', orderIndex: 3, difficulty: 'intermediate', estimatedMinutes: 90, completionPercent: 0, componentCount: 3 },
    { id: 'dv-4', cityId: 'data-vault', name: 'Indexing & Performance', slug: 'indexing-performance', orderIndex: 4, difficulty: 'advanced', estimatedMinutes: 150, completionPercent: 0, componentCount: 4 },
    { id: 'dv-5', cityId: 'data-vault', name: 'Transactions', slug: 'transactions', orderIndex: 5, difficulty: 'advanced', estimatedMinutes: 120, completionPercent: 0, componentCount: 4 },
    { id: 'dv-6', cityId: 'data-vault', name: 'NoSQL Concepts', slug: 'nosql-concepts', orderIndex: 6, difficulty: 'intermediate', estimatedMinutes: 90, completionPercent: 0, componentCount: 3 },
    { id: 'dv-7', cityId: 'data-vault', name: 'Database Security', slug: 'database-security', orderIndex: 7, difficulty: 'advanced', estimatedMinutes: 120, completionPercent: 0, componentCount: 4 },
  ],
}

// Generate default levels for cities without specific data
export function getLevelsForCity(cityId: string): WorldLevel[] {
  if (MOCK_LEVELS[cityId]) {
    return MOCK_LEVELS[cityId]
  }
  
  // Generate placeholder levels
  const city = MOCK_CITIES.find(c => c.id === cityId)
  if (!city) return []
  
  return Array.from({ length: city.levelCount }, (_, i) => ({
    id: `${cityId}-${i + 1}`,
    cityId,
    name: `Level ${i + 1}`,
    slug: `level-${i + 1}`,
    orderIndex: i + 1,
    difficulty: i < 2 ? 'beginner' : i < 4 ? 'intermediate' : 'advanced' as const,
    estimatedMinutes: 60 + i * 30,
    completionPercent: 0,
    componentCount: 3 + Math.floor(Math.random() * 3),
  }))
}

// Mock components for levels
export function getComponentsForLevel(levelId: string): LevelComponent[] {
  // Generate mock components based on level
  const componentCount = 3 + Math.floor(Math.random() * 3)
  
  return Array.from({ length: componentCount }, (_, i) => ({
    id: `${levelId}-comp-${i + 1}`,
    levelId,
    name: `Component ${i + 1}`,
    description: 'Learn the core concepts and apply them in practice through guided exercises and real-world examples.',
    orderIndex: i + 1,
    completed: Math.random() > 0.7,
    resources: [
      {
        id: `${levelId}-res-${i}-1`,
        title: 'Video Tutorial',
        type: 'video' as const,
        url: 'https://youtube.com',
        durationMinutes: 15,
      },
      {
        id: `${levelId}-res-${i}-2`,
        title: 'Documentation',
        type: 'article' as const,
        url: 'https://docs.example.com',
        durationMinutes: 10,
      },
      {
        id: `${levelId}-res-${i}-3`,
        title: 'Practice Quiz',
        type: 'quiz' as const,
        url: '/quiz',
        durationMinutes: 5,
      },
    ],
  }))
}
