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
  /** Optional Sanity blog slug to deep-link related writing */
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
      'AI resume tailoring and application tracking. Match a resume to a job post and manage the pipeline in one place.',
    image: '/hireiq-cover.png',
    tech: ['Next.js', 'Supabase', 'Claude', 'TypeScript'],
    liveUrl: 'https://hireiq-nu.vercel.app',
    repoUrl: 'https://github.com/KingSharif1/HireIQ',
  },
  {
    id: 'kingslive',
    title: 'KingsLive · CTROOM',
    year: '2026',
    status: 'Live',
    description:
      'Personal command center for missions, Milo AI, Vault finance, and daily ops — auth, planner, and live bank data.',
    image: '/kingslive-cover.png',
    tech: ['Next.js', 'Supabase', 'Teller', 'Sanity', 'Tailwind'],
    liveUrl: 'https://kingsharif.com/ctroom',
    repoUrl: 'https://github.com/KingSharif1/kingslive',
  },
  {
    id: '1942',
    title: '1942: Truly Forgotten',
    year: '2025',
    status: 'Live',
    description:
      'Brand storefront with a cinematic manifesto video and product storytelling. Built for a sharp, modern shopping front.',
    image: '/1942-forgotten.png',
    tech: ['React', 'Vite', 'Tailwind CSS', 'TypeScript'],
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
      'Ops dashboard for Roomba fleet / home automation insights. Writing and repo landing here as the build ships.',
    image: '/kingslive-cover.png',
    tech: ['Next.js', 'TypeScript', 'APIs'],
    repoUrl: 'https://github.com/KingSharif1',
  },
  {
    id: 'nemt-billing',
    title: 'NEMT Billing',
    year: '2023',
    status: 'Live',
    description:
      'Billing platform for non-emergency medical transport — invoices, payments, and authenticated operator workflows.',
    image: '/nemtbiling.png',
    tech: ['Next.js', 'Strapi', 'TypeScript', 'Context API'],
    liveUrl: 'https://nemtbiling.com',
  },
  {
    id: 'sweet-emporium',
    title: 'My Sweet Emporium',
    year: '2024',
    status: 'Live',
    description:
      'E-commerce storefront for specialty candy — catalog, inventory, and checkout on WordPress + WooCommerce.',
    image: '/se-update.png',
    tech: ['WordPress', 'WooCommerce', 'PHP'],
    liveUrl: 'https://mysweetemporium.com',
  },
]

export const ALL_PROJECTS = [...FEATURED_PROJECTS, ...ARCHIVE_PROJECTS]

export function getProjectById(id: string): PortfolioProject | undefined {
  return ALL_PROJECTS.find((p) => p.id === id)
}
