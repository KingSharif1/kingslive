/**
 * Portfolio projects — featured (top 3) + archive (expandable).
 * Keep descriptions short, professional, and skill-forward.
 * `id` is the stable key used for blog ↔ project linking (Sanity relatedProjectId).
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
  /** Canonical blog post slug when one post is the project write-up */
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
      'Tailors resumes to job posts with AI and tracks applications end to end.',
    image: '/hireiq-cover.png',
    tech: ['Next.js', 'TypeScript', 'Supabase', 'Claude'],
    liveUrl: 'https://hireiq-nu.vercel.app',
    repoUrl: 'https://github.com/KingSharif1/HireIQ',
  },
  {
    id: 'kingslive',
    title: 'KingsLive · CTROOM',
    year: '2026',
    status: 'Live',
    description:
      'Personal HQ for missions, Milo AI, Vault finance, and day-to-day ops.',
    image: '/kingslive-cover.png',
    tech: ['Next.js', 'TypeScript', 'Supabase', 'Teller', 'Sanity'],
    liveUrl: 'https://kingsharif.com/ctroom',
    repoUrl: 'https://github.com/KingSharif1/kingslive',
    blogSlug: 'updating-portfolio',
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
]

/** Additional projects — revealed via “Show all” */
export const ARCHIVE_PROJECTS: PortfolioProject[] = [
  {
    id: 'roomba-dashboard',
    title: 'Roomba Dashboard',
    year: '2026',
    status: 'In Progress',
    description:
      'Dashboard for Roomba status, runs, and home-ops insights. Build + write-ups landing here.',
    image: '/kingslive-cover.png',
    tech: ['Next.js', 'TypeScript', 'APIs'],
    repoUrl: 'https://github.com/KingSharif1/roomba-dashboard',
  },
  {
    id: 'nemt-billing',
    title: 'NEMT Billing',
    year: '2023',
    status: 'Live',
    description:
      'Invoicing and payments for non-emergency medical transport operators.',
    image: '/nemtbiling.png',
    tech: ['Next.js', 'TypeScript', 'Strapi', 'Context API'],
    liveUrl: 'https://nemtbiling.com',
  },
  {
    id: 'sweet-emporium',
    title: 'My Sweet Emporium',
    year: '2024',
    status: 'Live',
    description:
      'Specialty candy e-commerce — catalog, inventory, and checkout.',
    image: '/se-update.png',
    tech: ['WordPress', 'WooCommerce', 'PHP'],
    liveUrl: 'https://mysweetemporium.com',
  },
]

export const ALL_PROJECTS = [...FEATURED_PROJECTS, ...ARCHIVE_PROJECTS]

export function getProjectById(id: string): PortfolioProject | undefined {
  return ALL_PROJECTS.find((p) => p.id === id)
}
