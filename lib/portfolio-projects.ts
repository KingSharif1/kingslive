/**
 * Portfolio projects — only work King actually ships / circled on GitHub.
 * Top 3 featured; archive expands via dropdown.
 * `id` links Sanity posts via relatedProjectId.
 */
export type PortfolioProject = {
  id: string
  title: string
  year: string
  status: 'Live' | 'In Progress'
  description: string
  image: string
  tech: string[]
  liveUrl?: string
  repoUrl?: string
  blogSlug?: string
}

/** Top 3 — shown by default */
export const FEATURED_PROJECTS: PortfolioProject[] = [
  {
    id: 'hireiq',
    title: 'HireIQ',
    year: '2026',
    status: 'Live',
    description:
      'AI resume tailoring and application tracking for landing the right role faster.',
    image: '/hireiq-cover.png',
    tech: ['Next.js', 'TypeScript', 'Supabase', 'Claude'],
    liveUrl: 'https://hireiq-nu.vercel.app',
    repoUrl: 'https://github.com/KingSharif1/HireIQ',
  },
  {
    id: 'dfwnemt',
    title: 'DfwNemt',
    year: '2026',
    status: 'Live',
    description:
      'NEMT driver payment calculator — automates trip-to-payment billing. Live with paying customers.',
    image: '/dfwnemt-cover.png',
    tech: ['TypeScript', 'Next.js', 'SaaS'],
    repoUrl: 'https://github.com/KingSharif1/DfwNemt',
  },
  {
    id: 'ridenemt',
    title: 'RideNEMT',
    year: '2026',
    status: 'Live',
    description:
      'RideCuro — non-emergency medical transportation SaaS for operators and riders.',
    image: '/ridenemt-cover.png',
    tech: ['TypeScript', 'Next.js', 'SaaS'],
    repoUrl: 'https://github.com/KingSharif1/RideNEMT',
  },
]

/** Archive — revealed via “All projects” dropdown */
export const ARCHIVE_PROJECTS: PortfolioProject[] = [
  {
    id: 'roomba-dashboard',
    title: 'Roomba Dashboard',
    year: '2026',
    status: 'In Progress',
    description:
      'Ops dashboard for Roomba status, runs, and home automation insights.',
    image: '/roomba-cover.png',
    tech: ['TypeScript', 'Next.js', 'APIs'],
    repoUrl: 'https://github.com/KingSharif1/roomba-dashboard',
  },
  {
    id: 'nami',
    title: 'Nami',
    year: '2026',
    status: 'In Progress',
    description:
      'Product build in TypeScript — Nami experience and supporting tooling.',
    image: '/nami-cover.png',
    tech: ['TypeScript', 'Next.js'],
    repoUrl: 'https://github.com/KingSharif1/nami',
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
  },
  {
    id: 'kudsi',
    title: 'KudsiWebsite',
    year: '2025',
    status: 'Live',
    description:
      'Community website for Kudsi — content, presence, and a clean TypeScript front end.',
    image: '/kudsi-cover.png',
    tech: ['TypeScript', 'Web'],
    repoUrl: 'https://github.com/KingSharif1/KudsiWebsite',
  },
  {
    id: '1942',
    title: '1942: Truly Forgotten',
    year: '2025',
    status: 'Live',
    description:
      'Brand storefront with cinematic manifesto video and product storytelling.',
    image: '/1942-forgotten.png',
    tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    liveUrl: 'https://trulyforgtten.shop',
    repoUrl: 'https://github.com/KingSharif1/1942-truly-forgotten',
  },
  {
    id: 'am-african-market',
    title: 'AM African Market',
    year: '2025',
    status: 'Live',
    description:
      'E-commerce for African market goods — catalog, inventory, and checkout.',
    image: '/african-market-cover.png',
    tech: ['TypeScript', 'E-commerce'],
    repoUrl: 'https://github.com/KingSharif1/am-african-market',
  },
]

export const ALL_PROJECTS = [...FEATURED_PROJECTS, ...ARCHIVE_PROJECTS]

export function getProjectById(id: string): PortfolioProject | undefined {
  return ALL_PROJECTS.find((p) => p.id === id)
}
