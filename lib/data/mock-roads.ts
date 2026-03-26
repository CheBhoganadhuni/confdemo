// Mock data for the /road page
// This will be replaced with Supabase queries when connected

export interface RoadComponent {
  id: string
  roadId: string
  name: string
  description: string
  orderIndex: number
  estimatedMinutes: number
  cityId: string | null // optional link to a city
  cityName: string | null
  completed: boolean
  available: boolean // can user start this?
  resources: RoadResource[]
}

export interface RoadResource {
  id: string
  title: string
  type: 'video' | 'article' | 'quiz' | 'project' | 'external'
  url: string
  durationMinutes: number | null
}

export interface Road {
  id: string
  name: string
  slug: string
  description: string
  color: string
  icon: string // Lucide icon name
  type: 'preset' | 'university' | 'custom'
  creatorName?: string
  componentCount: number
  totalHours: number
  completionPercent: number
}

export interface UserDailyProgress {
  todayMinutes: number
  dailyLimit: number // 120
}

// Mock preset roads
export const MOCK_ROADS: Road[] = [
  {
    id: 'full-stack',
    name: 'Full-Stack Engineer',
    slug: 'full-stack',
    description: 'Master both frontend and backend development to build complete web applications.',
    color: '#F97316',
    icon: 'Layers',
    type: 'preset',
    componentCount: 24,
    totalHours: 48,
    completionPercent: 35,
  },
  {
    id: 'data-engineer',
    name: 'Data Engineer',
    slug: 'data-engineer',
    description: 'Learn to build and maintain data pipelines and infrastructure.',
    color: '#0284C7',
    icon: 'Database',
    type: 'preset',
    componentCount: 20,
    totalHours: 40,
    completionPercent: 0,
  },
  {
    id: 'systems-programmer',
    name: 'Systems Programmer',
    slug: 'systems-programmer',
    description: 'Deep dive into operating systems, compilers, and low-level programming.',
    color: '#DC2626',
    icon: 'Cpu',
    type: 'preset',
    componentCount: 18,
    totalHours: 36,
    completionPercent: 10,
  },
  {
    id: 'ml-engineer',
    name: 'ML Engineer',
    slug: 'ml-engineer',
    description: 'Build machine learning models and deploy them to production.',
    color: '#7C3AED',
    icon: 'Brain',
    type: 'preset',
    componentCount: 22,
    totalHours: 44,
    completionPercent: 0,
  },
]

export const MOCK_UNIVERSITY_ROADS: Road[] = [
  {
    id: 'vit-dsa-track',
    name: 'VIT DSA Track',
    slug: 'vit-dsa-track',
    description: 'Covers all DSA topics required for VIT placements.',
    color: '#10B981',
    icon: 'GraduationCap',
    type: 'university',
    creatorName: 'Prof. Sharma',
    componentCount: 16,
    totalHours: 32,
    completionPercent: 50,
  },
  {
    id: 'vit-web-dev',
    name: 'VIT Web Development',
    slug: 'vit-web-dev',
    description: 'Complete web development curriculum for VIT students.',
    color: '#6366F1',
    icon: 'Globe',
    type: 'university',
    creatorName: 'Dr. Patel',
    componentCount: 14,
    totalHours: 28,
    completionPercent: 0,
  },
]

export const MOCK_CUSTOM_ROADS: Road[] = [
  {
    id: 'my-interview-prep',
    name: 'My Interview Prep',
    slug: 'my-interview-prep',
    description: 'Custom road for FAANG interview preparation.',
    color: '#D97706',
    icon: 'Target',
    type: 'custom',
    componentCount: 12,
    totalHours: 24,
    completionPercent: 25,
  },
]

// Mock components for the full-stack road
export const MOCK_ROAD_COMPONENTS: Record<string, RoadComponent[]> = {
  'full-stack': [
    {
      id: 'fs-1',
      roadId: 'full-stack',
      name: 'HTML & CSS Fundamentals',
      description: 'Learn the building blocks of web pages.',
      orderIndex: 1,
      estimatedMinutes: 120,
      cityId: 'beginners-picnic',
      cityName: "Beginner's Picnic",
      completed: true,
      available: true,
      resources: [
        { id: 'fs-1-r1', title: 'HTML Crash Course', type: 'video', url: 'https://youtube.com', durationMinutes: 45 },
        { id: 'fs-1-r2', title: 'CSS Guide', type: 'article', url: 'https://developer.mozilla.org', durationMinutes: 30 },
        { id: 'fs-1-r3', title: 'Build a Landing Page', type: 'project', url: '/projects/landing', durationMinutes: 45 },
      ],
    },
    {
      id: 'fs-2',
      roadId: 'full-stack',
      name: 'JavaScript Basics',
      description: 'Master the language of the web.',
      orderIndex: 2,
      estimatedMinutes: 180,
      cityId: 'beginners-picnic',
      cityName: "Beginner's Picnic",
      completed: true,
      available: true,
      resources: [
        { id: 'fs-2-r1', title: 'JavaScript Fundamentals', type: 'video', url: 'https://youtube.com', durationMinutes: 60 },
        { id: 'fs-2-r2', title: 'ES6+ Features', type: 'article', url: 'https://javascript.info', durationMinutes: 45 },
        { id: 'fs-2-r3', title: 'JS Quiz', type: 'quiz', url: '/quiz/js-basics', durationMinutes: 15 },
        { id: 'fs-2-r4', title: 'Todo App Project', type: 'project', url: '/projects/todo', durationMinutes: 60 },
      ],
    },
    {
      id: 'fs-3',
      roadId: 'full-stack',
      name: 'React Fundamentals',
      description: 'Build modern UIs with React.',
      orderIndex: 3,
      estimatedMinutes: 240,
      cityId: 'engine-room',
      cityName: 'Engine Room',
      completed: true,
      available: true,
      resources: [
        { id: 'fs-3-r1', title: 'React Basics', type: 'video', url: 'https://youtube.com', durationMinutes: 90 },
        { id: 'fs-3-r2', title: 'React Docs', type: 'article', url: 'https://react.dev', durationMinutes: 60 },
        { id: 'fs-3-r3', title: 'Component Quiz', type: 'quiz', url: '/quiz/react', durationMinutes: 20 },
        { id: 'fs-3-r4', title: 'Dashboard Project', type: 'project', url: '/projects/dashboard', durationMinutes: 70 },
      ],
    },
    {
      id: 'fs-4',
      roadId: 'full-stack',
      name: 'State Management',
      description: 'Learn Redux, Context, and modern state patterns.',
      orderIndex: 4,
      estimatedMinutes: 150,
      cityId: 'engine-room',
      cityName: 'Engine Room',
      completed: false,
      available: true,
      resources: [
        { id: 'fs-4-r1', title: 'State Management Deep Dive', type: 'video', url: 'https://youtube.com', durationMinutes: 60 },
        { id: 'fs-4-r2', title: 'Redux Toolkit Guide', type: 'article', url: 'https://redux-toolkit.js.org', durationMinutes: 45 },
        { id: 'fs-4-r3', title: 'State Quiz', type: 'quiz', url: '/quiz/state', durationMinutes: 15 },
        { id: 'fs-4-r4', title: 'Shopping Cart Project', type: 'project', url: '/projects/cart', durationMinutes: 30 },
      ],
    },
    {
      id: 'fs-5',
      roadId: 'full-stack',
      name: 'Node.js & Express',
      description: 'Build server-side applications.',
      orderIndex: 5,
      estimatedMinutes: 180,
      cityId: 'api-district',
      cityName: 'API District',
      completed: false,
      available: false,
      resources: [
        { id: 'fs-5-r1', title: 'Node.js Fundamentals', type: 'video', url: 'https://youtube.com', durationMinutes: 75 },
        { id: 'fs-5-r2', title: 'Express.js Guide', type: 'article', url: 'https://expressjs.com', durationMinutes: 45 },
        { id: 'fs-5-r3', title: 'REST API Project', type: 'project', url: '/projects/api', durationMinutes: 60 },
      ],
    },
    {
      id: 'fs-6',
      roadId: 'full-stack',
      name: 'Database Design',
      description: 'Learn SQL and NoSQL databases.',
      orderIndex: 6,
      estimatedMinutes: 150,
      cityId: 'data-vault',
      cityName: 'Data Vault',
      completed: false,
      available: false,
      resources: [
        { id: 'fs-6-r1', title: 'SQL Fundamentals', type: 'video', url: 'https://youtube.com', durationMinutes: 60 },
        { id: 'fs-6-r2', title: 'PostgreSQL Guide', type: 'article', url: 'https://postgresql.org/docs', durationMinutes: 45 },
        { id: 'fs-6-r3', title: 'Database Project', type: 'project', url: '/projects/db', durationMinutes: 45 },
      ],
    },
    {
      id: 'fs-7',
      roadId: 'full-stack',
      name: 'Authentication & Security',
      description: 'Implement secure authentication flows.',
      orderIndex: 7,
      estimatedMinutes: 120,
      cityId: null,
      cityName: null,
      completed: false,
      available: false,
      resources: [
        { id: 'fs-7-r1', title: 'Auth Deep Dive', type: 'video', url: 'https://youtube.com', durationMinutes: 50 },
        { id: 'fs-7-r2', title: 'JWT & Sessions', type: 'article', url: 'https://auth0.com/docs', durationMinutes: 35 },
        { id: 'fs-7-r3', title: 'Auth Project', type: 'project', url: '/projects/auth', durationMinutes: 35 },
      ],
    },
    {
      id: 'fs-8',
      roadId: 'full-stack',
      name: 'Deployment & DevOps',
      description: 'Deploy and manage applications in production.',
      orderIndex: 8,
      estimatedMinutes: 90,
      cityId: 'cloud-deck',
      cityName: 'Cloud Deck',
      completed: false,
      available: false,
      resources: [
        { id: 'fs-8-r1', title: 'CI/CD Pipelines', type: 'video', url: 'https://youtube.com', durationMinutes: 40 },
        { id: 'fs-8-r2', title: 'Vercel Deployment', type: 'article', url: 'https://vercel.com/docs', durationMinutes: 25 },
        { id: 'fs-8-r3', title: 'Deploy Project', type: 'project', url: '/projects/deploy', durationMinutes: 25 },
      ],
    },
  ],
}

// Helper to get roads by type
export function getRoadsByType(type: Road['type']): Road[] {
  switch (type) {
    case 'preset':
      return MOCK_ROADS
    case 'university':
      return MOCK_UNIVERSITY_ROADS
    case 'custom':
      return MOCK_CUSTOM_ROADS
    default:
      return []
  }
}

// Helper to get components for a road
export function getComponentsForRoad(roadId: string): RoadComponent[] {
  if (MOCK_ROAD_COMPONENTS[roadId]) {
    return MOCK_ROAD_COMPONENTS[roadId]
  }
  
  // Generate placeholder components
  const road = [...MOCK_ROADS, ...MOCK_UNIVERSITY_ROADS, ...MOCK_CUSTOM_ROADS].find(r => r.id === roadId)
  if (!road) return []
  
  const count = Math.min(road.componentCount, 8)
  return Array.from({ length: count }, (_, i) => ({
    id: `${roadId}-${i + 1}`,
    roadId,
    name: `Component ${i + 1}`,
    description: 'Learn essential concepts and apply them through hands-on practice.',
    orderIndex: i + 1,
    estimatedMinutes: 60 + Math.floor(Math.random() * 60),
    cityId: null,
    cityName: null,
    completed: i < Math.floor(count * road.completionPercent / 100),
    available: i <= Math.floor(count * road.completionPercent / 100),
    resources: [
      { id: `${roadId}-${i}-r1`, title: 'Video Tutorial', type: 'video', url: 'https://youtube.com', durationMinutes: 30 },
      { id: `${roadId}-${i}-r2`, title: 'Documentation', type: 'article', url: 'https://docs.example.com', durationMinutes: 20 },
      { id: `${roadId}-${i}-r3`, title: 'Practice', type: 'project', url: '/projects', durationMinutes: 30 },
    ],
  }))
}

// Mock daily progress
export const MOCK_DAILY_PROGRESS: UserDailyProgress = {
  todayMinutes: 45,
  dailyLimit: 120,
}
