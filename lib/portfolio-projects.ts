/**
 * Portfolio projects — seed / static fallback.
 * Runtime source of truth: Supabase `portfolio_projects` (edited in CTROOM).
 * Docs used: HireIQ README+SPEC, 1942 README; private repos use GitHub descriptions.
 */
export type PortfolioProject = {
  id: string
  title: string
  year: string
  status: 'Deployed' | 'In Progress'
  description: string
  image: string
  tech: string[]
  liveUrl?: string
  repoUrl?: string
  blogSlug?: string
  featured?: boolean
  sortOrder?: number
  published?: boolean
}

/** Default seed — used until Supabase table is populated */
export const FEATURED_PROJECTS: PortfolioProject[] = [
  {
    id: 'hireiq',
    title: 'HireIQ',
    year: '2026',
    status: 'Deployed',
    description:
      'AI-assisted resume matching and application tracking — score fit against a job post and keep every application organized.',
    image: '/hireiq-cover.png',
    tech: ['Next.js', 'TypeScript', 'Supabase', 'Claude'],
    liveUrl: 'https://hireiq-nu.vercel.app',
    repoUrl: 'https://github.com/KingSharif1/HireIQ',
    featured: true,
    sortOrder: 0,
  },
  {
    id: 'ridenemt',
    title: 'RideNEMT',
    year: '2026',
    status: 'Deployed',
    description:
      'NEMT SaaS for operators and riders — scheduling, trips, and operations for non-emergency medical transport.',
    image: '/ridenemt-cover.png',
    tech: ['TypeScript', 'Next.js', 'SaaS'],
    repoUrl: 'https://github.com/KingSharif1/RideNEMT',
    featured: true,
    sortOrder: 1,
  },
  {
    id: 'roomba-dashboard',
    title: 'Roomba Dashboard',
    year: '2026',
    status: 'Deployed',
    description:
      'Live ops dashboard for Roomba status, run history, and home automation controls.',
    image: '/roomba-cover.png',
    tech: ['TypeScript', 'Next.js', 'APIs'],
    liveUrl: 'https://roomba-dashboard.vercel.app',
    repoUrl: 'https://github.com/KingSharif1/roomba-dashboard',
    featured: true,
    sortOrder: 2,
  },
]

export const ARCHIVE_PROJECTS: PortfolioProject[] = [
  {
    id: 'dfwnemt',
    title: 'DfwNemt',
    year: '2026',
    status: 'Deployed',
    description:
      'NEMT driver payment calculator — automates trip-to-payment billing. Live with paying customers.',
    image: '/dfwnemt-cover.png',
    tech: ['TypeScript', 'Next.js', 'SaaS'],
    repoUrl: 'https://github.com/KingSharif1/DfwNemt',
    featured: false,
    sortOrder: 3,
  },
  {
    id: 'nami',
    title: 'Nami',
    year: '2026',
    status: 'In Progress',
    description:
      'TypeScript product experience with supporting tooling for the Nami platform.',
    image: '/nami-cover.png',
    tech: ['TypeScript', 'Next.js'],
    repoUrl: 'https://github.com/KingSharif1/nami',
    featured: false,
    sortOrder: 4,
  },
  {
    id: 'ai-receptionist',
    title: 'AI Receptionist',
    year: '2026',
    status: 'In Progress',
    description:
      'Automated receptionist for calls, booking, and front-desk workflows.',
    image: '/ai-receptionist-cover.png',
    tech: ['TypeScript', 'AI', 'APIs'],
    repoUrl: 'https://github.com/KingSharif1/ai_receptionist',
    featured: false,
    sortOrder: 5,
  },
  {
    id: 'kudsi',
    title: 'KudsiWebsite',
    year: '2025',
    status: 'Deployed',
    description:
      'Community website for Kudsi — content, presence, and a TypeScript front end.',
    image: '/kudsi-cover.png',
    tech: ['TypeScript', 'Web'],
    repoUrl: 'https://github.com/KingSharif1/KudsiWebsite',
    featured: false,
    sortOrder: 6,
  },
  {
    id: '1942',
    title: '1942: Truly Forgotten',
    year: '2025',
    status: 'Deployed',
    description:
      'Clothing shop front end with manifesto video intro and a coming-soon storefront. React, TypeScript, Vite, Tailwind.',
    image: '/1942-forgotten.png',
    tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    liveUrl: 'https://trulyforgtten.shop',
    repoUrl: 'https://github.com/KingSharif1/1942-truly-forgotten',
    featured: false,
    sortOrder: 7,
  },
  {
    id: 'am-african-market',
    title: 'AM African Market',
    year: '2025',
    status: 'In Progress',
    description:
      'E-commerce for African market goods — catalog, inventory, and checkout.',
    image: '/african-market-cover.png',
    tech: ['TypeScript', 'E-commerce'],
    repoUrl: 'https://github.com/KingSharif1/am-african-market',
    featured: false,
    sortOrder: 8,
  },
]

export const ALL_PROJECTS = [...FEATURED_PROJECTS, ...ARCHIVE_PROJECTS]

export function getProjectById(id: string): PortfolioProject | undefined {
  return ALL_PROJECTS.find((p) => p.id === id)
}

export function splitFeaturedArchive(projects: PortfolioProject[]): {
  featured: PortfolioProject[]
  archive: PortfolioProject[]
} {
  const sorted = [...projects].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
  const featured = sorted.filter((p) => p.featured)
  const archive = sorted.filter((p) => !p.featured)
  // If DB has no featured flags, fall back to first 3
  if (featured.length === 0 && sorted.length > 0) {
    return {
      featured: sorted.slice(0, 3),
      archive: sorted.slice(3),
    }
  }
  return { featured, archive }
}
