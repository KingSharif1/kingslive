import { createClient } from '@supabase/supabase-js'
import { ALL_PROJECTS, type PortfolioProject } from '@/lib/portfolio-projects'
import { rowToProject, type PortfolioProjectRow } from '@/app/ctroom/services/portfolioProjectRow'

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /portfolio_projects/i.test(error.message || '') ||
    /relation .* does not exist/i.test(error.message || '')
  )
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Public read — static seed only if the table is missing or the query fails */
export async function fetchPublishedProjects(): Promise<{
  projects: PortfolioProject[]
  source: 'supabase' | 'static'
  tableMissing?: boolean
}> {
  const supabase = publicClient()
  if (!supabase) {
    return { projects: ALL_PROJECTS, source: 'static', tableMissing: true }
  }

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
