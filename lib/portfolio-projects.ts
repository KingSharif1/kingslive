/**
 * Portfolio projects — seed / static fallback.
 * Runtime source of truth: Supabase `portfolio_projects` (edited in CTROOM).
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
  /** When false/undefined with a private repo — hide GitHub link on public site */
  repoPublic?: boolean
  /** ISO date for timeline ordering (newest first). Falls back to year-01-01 */
  timelineDate?: string
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
      'AI resume tailoring and application tracking — match a resume to a job post, PDF preview, and keep every application in one place.',
    image: '/hireiq-cover.png',
    tech: ['Next.js', 'TypeScript', 'Supabase', 'Claude', 'Tailwind'],
    liveUrl: 'https://hireiq.kingsharif.com',
    repoUrl: 'https://github.com/KingSharif1/HireIQ',
    repoPublic: true,
    timelineDate: '2026-03-01',
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
    tech: ['TypeScript', 'Next.js', 'Supabase', 'SaaS'],
    liveUrl: 'https://app.ridenemt.com',
    repoUrl: 'https://github.com/KingSharif1/RideNEMT',
    repoPublic: false,
    timelineDate: '2026-02-15',
    featured: true,
    sortOrder: 1,
  },
  {
    id: 'roomba-dashboard',
    title: 'Roomba',
    year: '2026',
    status: 'Deployed',
    description:
      'Live ops dashboard for Roomba status, run history, and home automation controls.',
    image: '/roomba-cover.png',
    tech: ['TypeScript', 'Next.js', 'APIs'],
    liveUrl: 'https://roomba.kingsharif.com',
    repoUrl: 'https://github.com/KingSharif1/roomba-dashboard',
    repoPublic: false,
    timelineDate: '2026-02-01',
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
    liveUrl: 'https://nemtbiling.com',
    repoUrl: 'https://github.com/KingSharif1/DfwNemt',
    repoPublic: false,
    timelineDate: '2026-01-15',
    featured: false,
    sortOrder: 3,
  },
  {
    id: 'nami',
    title: 'Nami',
    year: '2026',
    status: 'Deployed',
    description:
      'TypeScript product experience with supporting tooling for the Nami platform.',
    image: '/nami-cover.png',
    tech: ['TypeScript', 'Next.js'],
    liveUrl: 'https://nami.kingsharif.com',
    repoUrl: 'https://github.com/KingSharif1/nami',
    repoPublic: false,
    timelineDate: '2025-12-01',
    featured: false,
    sortOrder: 4,
  },
  {
    id: 'ai-receptionist',
    title: 'AI Receptionist',
    year: '2026',
    status: 'Deployed',
    description:
      'Automated receptionist for calls, booking, and front-desk workflows — Vapi admin console.',
    image: '/ai-receptionist-cover.png',
    tech: ['TypeScript', 'AI', 'Vapi'],
    liveUrl: 'https://vapi.kingsharif.com/admin',
    repoUrl: 'https://github.com/KingSharif1/ai_receptionist',
    repoPublic: false,
    timelineDate: '2025-11-01',
    featured: false,
    sortOrder: 5,
  },
  {
    id: 'kudsi',
    title: 'Kudusi',
    year: '2025',
    status: 'Deployed',
    description:
      'Community website for Kudusi — content, presence, and a TypeScript front end.',
    image: '/kudsi-cover.png',
    tech: ['TypeScript', 'Web'],
    liveUrl: 'https://www.kudusi.org',
    repoUrl: 'https://github.com/KingSharif1/KudsiWebsite',
    repoPublic: false,
    timelineDate: '2025-09-01',
    featured: false,
    sortOrder: 6,
  },
  {
    id: '1942',
    title: '1942: Truly Forgotten',
    year: '2025',
    status: 'Deployed',
    description:
      'Clothing shop front end with manifesto video intro and a coming-soon storefront.',
    image: '/1942-forgotten.png',
    tech: ['React', 'TypeScript', 'Vite', 'Tailwind'],
    liveUrl: 'https://trulyforgtten.shop',
    repoUrl: 'https://github.com/KingSharif1/1942-truly-forgotten',
    repoPublic: true,
    timelineDate: '2025-06-01',
    featured: false,
    sortOrder: 7,
  },
  {
    id: 'am-african-market',
    title: 'AM African Market',
    year: '2025',
    status: 'Deployed',
    description:
      'E-commerce for A&M African Market in Abilene — catalog, store info, and online presence.',
    image: '/african-market-cover.png',
    tech: ['TypeScript', 'Next.js', 'E-commerce'],
    liveUrl: 'https://amafricanmarket.com',
    repoUrl: 'https://github.com/KingSharif1/am-african-market',
    repoPublic: false,
    timelineDate: '2025-04-01',
    featured: false,
    sortOrder: 8,
  },
]

export const ALL_PROJECTS = [...FEATURED_PROJECTS, ...ARCHIVE_PROJECTS]

export function getProjectById(id: string): PortfolioProject | undefined {
  return ALL_PROJECTS.find((p) => p.id === id)
}

export function getTimelineDate(project: PortfolioProject): string {
  if (project.timelineDate) return project.timelineDate
  const y = project.year?.match(/\d{4}/)?.[0] || '2025'
  return `${y}-01-01`
}

/** Newest first */
export function sortProjectsByTimeline(projects: PortfolioProject[]): PortfolioProject[] {
  return [...projects].sort((a, b) => {
    const byDate = getTimelineDate(b).localeCompare(getTimelineDate(a))
    if (byDate !== 0) return byDate
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })
}

export function getFeaturedHighlights(projects: PortfolioProject[]): PortfolioProject[] {
  const featured = projects
    .filter((p) => p.featured)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  if (featured.length >= 3) return featured.slice(0, 3)
  if (featured.length > 0) return featured
  return sortProjectsByTimeline(projects).slice(0, 3)
}

export function getInProgressByTimeline(projects: PortfolioProject[]): PortfolioProject[] {
  return sortProjectsByTimeline(projects.filter((p) => p.status === 'In Progress'))
}

export function showGithubLink(project: PortfolioProject): boolean {
  return Boolean(project.repoUrl && project.repoPublic === true)
}

export function getGithubRepoPath(repoUrl: string | null | undefined): string | null {
  if (!repoUrl) return null
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/#?]+)/i)
  return match ? match[1].replace(/\.git$/, '') : null
}

export function splitFeaturedArchive(projects: PortfolioProject[]): {
  featured: PortfolioProject[]
  archive: PortfolioProject[]
} {
  const featured = getFeaturedHighlights(projects)
  const featuredIds = new Set(featured.map((p) => p.id))
  const archive = sortProjectsByTimeline(projects.filter((p) => !featuredIds.has(p.id)))
  return { featured, archive }
}

export function formatTimelineLabel(project: PortfolioProject): string {
  const iso = getTimelineDate(project)
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return project.year
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
