import type { PortfolioProject } from '@/lib/portfolio-projects'

export type PortfolioProjectRow = {
  id: string
  title: string
  year: string
  status: 'Deployed' | 'In Progress'
  description: string
  image: string
  tech: string[] | null
  live_url: string | null
  repo_url: string | null
  repo_public: boolean | null
  timeline_date: string | null
  blog_slug: string | null
  featured: boolean
  sort_order: number
  published: boolean
  created_at?: string
  updated_at?: string
}

export function rowToProject(row: PortfolioProjectRow): PortfolioProject {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    status: row.status,
    description: row.description,
    image: row.image,
    tech: row.tech ?? [],
    liveUrl: row.live_url || undefined,
    repoUrl: row.repo_url || undefined,
    repoPublic: row.repo_public ?? undefined,
    timelineDate: row.timeline_date || undefined,
    blogSlug: row.blog_slug || undefined,
    featured: row.featured,
    sortOrder: row.sort_order,
    published: row.published,
  }
}

export function projectToRow(
  project: Partial<PortfolioProject> & { id: string }
): Partial<PortfolioProjectRow> {
  return {
    id: project.id,
    title: project.title,
    year: project.year,
    status: project.status,
    description: project.description,
    image: project.image,
    tech: project.tech,
    live_url: project.liveUrl ?? null,
    repo_url: project.repoUrl ?? null,
    repo_public: project.repoPublic ?? false,
    timeline_date: project.timelineDate ?? null,
    blog_slug: project.blogSlug ?? null,
    featured: project.featured ?? false,
    sort_order: project.sortOrder ?? 0,
    published: project.published ?? true,
    updated_at: new Date().toISOString(),
  }
}
