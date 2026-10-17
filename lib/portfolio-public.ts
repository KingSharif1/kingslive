import { rowToProject, type PortfolioProjectRow } from '@/app/ctroom/services/portfolioProjectRow'
import { ALL_PROJECTS, type PortfolioProject } from '@/lib/portfolio-projects'
import { apiVersion, dataset, projectId } from '@/sanity/env'

/** Match the homepage ISR window. Live edits show up within a few minutes. */
export const PORTFOLIO_REVALIDATE_SECONDS = 300

export type PortfolioNote = {
  id: string
  title: string
  slug: string
  excerpt: string
  createdAt: string
  tag?: string
}

type SanityNoteRow = {
  _id: string
  title?: string
  slug?: string
  publishedAt?: string
  _createdAt?: string
  excerpt?: string
  tag?: string | null
}

function missingPortfolioTable(status: number, body: string) {
  return (
    status === 404 ||
    body.includes('PGRST205') ||
    body.includes('42P01') ||
    /does not exist/i.test(body) ||
    /portfolio_projects/i.test(body)
  )
}

/**
 * Published rows from `portfolio_projects`.
 * Static seed only when the table is missing or the request fails — same rule as the old client fetch.
 * An empty published set stays empty.
 */
export async function loadPublishedProjects(): Promise<PortfolioProject[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url.includes('127.0.0.1')) return ALL_PROJECTS

  const endpoint = new URL('/rest/v1/portfolio_projects', url)
  endpoint.searchParams.set(
    'select',
    'id,title,year,status,description,image,tech,live_url,repo_url,repo_public,timeline_date,blog_slug,featured,sort_order,published'
  )
  endpoint.searchParams.set('published', 'eq.true')
  endpoint.searchParams.set('order', 'sort_order.asc')

  try {
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      next: { revalidate: PORTFOLIO_REVALIDATE_SECONDS },
    })
    if (!res.ok) {
      const text = await res.text()
      if (!missingPortfolioTable(res.status, text)) {
        console.error('portfolio fetch error', res.status)
      }
      return ALL_PROJECTS
    }
    const data = (await res.json()) as PortfolioProjectRow[]
    if (!Array.isArray(data) || data.length === 0) return []
    return data.map((row) => rowToProject(row))
  } catch (err) {
    console.error('portfolio fetch failed', err)
    return ALL_PROJECTS
  }
}

/** Two homepage teasers. Titles and excerpts only — not the post body. */
export async function loadPortfolioNotes(limit = 2): Promise<PortfolioNote[]> {
  const count = Math.min(6, Math.max(1, Math.floor(limit)))
  const query = `*[_type == "post" && (!defined(published) || published == true)] | order(coalesce(publishedAt, _createdAt) desc)[0...${count}]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    _createdAt,
    excerpt,
    "tag": categories[0]->title
  }`
  const endpoint = new URL(
    `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`
  )
  endpoint.searchParams.set('query', query)

  try {
    const res = await fetch(endpoint, { next: { revalidate: PORTFOLIO_REVALIDATE_SECONDS } })
    if (!res.ok) return []
    const body = (await res.json()) as { result?: SanityNoteRow[] }
    return (body.result ?? [])
      .filter((row) => Boolean(row.slug))
      .map((row) => ({
        id: row._id,
        title: row.title || 'Untitled',
        slug: row.slug as string,
        excerpt: (row.excerpt || '').trim(),
        createdAt: row.publishedAt || row._createdAt || new Date().toISOString(),
        tag: row.tag || undefined,
      }))
  } catch (err) {
    console.error('portfolio notes fetch failed', err)
    return []
  }
}
