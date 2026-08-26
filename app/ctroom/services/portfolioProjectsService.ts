import { createClient } from '@supabase/supabase-js'
import {
  ALL_PROJECTS,
  type PortfolioProject,
} from '@/lib/portfolio-projects'

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

function browserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /portfolio_projects/i.test(error.message || '') ||
    /relation .* does not exist/i.test(error.message || '')
  )
}

/** Public read — falls back to static seed if table missing / empty */
export async function fetchPublishedProjects(): Promise<{
  projects: PortfolioProject[]
  source: 'supabase' | 'static'
  tableMissing?: boolean
}> {
  try {
    const supabase = browserClient()
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true })

    if (error) {
      if (isMissingTable(error)) {
        return { projects: ALL_PROJECTS, source: 'static', tableMissing: true }
      }
      console.error('portfolio fetch error:', error)
      return { projects: ALL_PROJECTS, source: 'static' }
    }

    if (!data?.length) {
      return { projects: ALL_PROJECTS, source: 'static' }
    }

    return {
      projects: data.map((row) => rowToProject(row as PortfolioProjectRow)),
      source: 'supabase',
    }
  } catch (err) {
    console.error('portfolio fetch failed:', err)
    return { projects: ALL_PROJECTS, source: 'static', tableMissing: true }
  }
}

export class PortfolioProjectsService {
  static async listAll(): Promise<{
    projects: PortfolioProject[]
    tableMissing: boolean
  }> {
    const supabase = browserClient()
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      if (isMissingTable(error)) {
        return { projects: ALL_PROJECTS, tableMissing: true }
      }
      throw error
    }

    if (!data?.length) {
      return { projects: ALL_PROJECTS, tableMissing: false }
    }

    return {
      projects: data.map((row) => rowToProject(row as PortfolioProjectRow)),
      tableMissing: false,
    }
  }

  static async upsert(project: PortfolioProject): Promise<PortfolioProject> {
    const supabase = browserClient()
    const row = {
      ...projectToRow(project),
      created_at: undefined,
    }
    let { data, error } = await supabase
      .from('portfolio_projects')
      .upsert(row)
      .select('*')
      .single()

    // Older schemas may lack repo_public / timeline_date — retry without them
    if (error && /repo_public|timeline_date/i.test(error.message || '')) {
      const { repo_public: _rp, timeline_date: _td, ...legacy } = row as PortfolioProjectRow & {
        created_at?: undefined
      }
      const retry = await supabase.from('portfolio_projects').upsert(legacy).select('*').single()
      data = retry.data
      error = retry.error
    }

    if (error) throw error
    return rowToProject(data as PortfolioProjectRow)
  }

  static async remove(id: string): Promise<void> {
    const supabase = browserClient()
    const { error } = await supabase.from('portfolio_projects').delete().eq('id', id)
    if (error) throw error
  }

  static async seedFromStatic(): Promise<number> {
    const supabase = browserClient()
    const rows = ALL_PROJECTS.map((p, i) => ({
      ...projectToRow({ ...p, featured: p.featured ?? i < 3, sortOrder: p.sortOrder ?? i }),
      created_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('portfolio_projects').upsert(rows)
    if (error) throw error
    return rows.length
  }

  static async uploadCover(file: File): Promise<string> {
    const supabase = browserClient()
    const ext = file.name.split('.').pop() || 'png'
    const path = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('images').getPublicUrl(path)
    return data.publicUrl
  }
}
