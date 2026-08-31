import { supabase } from '@/lib/supabase'
import { ALL_PROJECTS, type PortfolioProject } from '@/lib/portfolio-projects'
import { projectToRow, rowToProject, type PortfolioProjectRow } from './portfolioProjectRow'

export type { PortfolioProjectRow }
export { projectToRow, rowToProject }

async function adminHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Sign in to CTROOM to edit projects')
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
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

/** Public read — static seed only if the table is missing or the query fails */
export async function fetchPublishedProjects(): Promise<{
  projects: PortfolioProject[]
  source: 'supabase' | 'static'
  tableMissing?: boolean
}> {
  try {
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
      return { projects: [], source: 'supabase' }
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
    const res = await fetch('/api/ctroom/portfolio', { headers: await adminHeaders() })
    const body = await res.json()
    if (res.status === 409 || body.tableMissing) {
      return { projects: [], tableMissing: true }
    }
    if (!res.ok) throw new Error(body.error || 'Failed to load projects')
    return {
      projects: (body.projects || []) as PortfolioProject[],
      tableMissing: false,
    }
  }

  static async upsert(project: PortfolioProject): Promise<PortfolioProject> {
    const res = await fetch('/api/ctroom/portfolio', {
      method: 'POST',
      headers: await adminHeaders(),
      body: JSON.stringify(project),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error || 'Save failed')
    return body.project as PortfolioProject
  }

  static async remove(id: string): Promise<void> {
    const res = await fetch(`/api/ctroom/portfolio?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: await adminHeaders(),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || 'Delete failed')
  }

  static async seedFromStatic(): Promise<number> {
    const res = await fetch('/api/ctroom/portfolio/bootstrap', {
      method: 'POST',
      headers: await adminHeaders(),
    })
    const body = await res.json()
    if (res.status === 409 && body.needsMigration) {
      const err = new Error(body.error || 'Create the portfolio_projects table first')
      ;(err as Error & { needsMigration?: boolean }).needsMigration = true
      throw err
    }
    if (!res.ok) throw new Error(body.error || 'Seed failed')
    return body.seeded as number
  }

  static async uploadCover(file: File): Promise<string> {
    const ext = file.name.split('.').pop() || 'png'
    const path = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('images').getPublicUrl(path)
    return data.publicUrl
  }
}
