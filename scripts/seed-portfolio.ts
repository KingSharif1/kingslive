import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { ALL_PROJECTS, type PortfolioProject } from '../lib/portfolio-projects.ts'

function env(name: string) {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const match = raw.match(new RegExp(`^${name}=(.*)$`, 'm'))
  if (!match) throw new Error(`Missing ${name}`)
  let v = match[1].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  return v
}

function toRow(project: PortfolioProject, index: number) {
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
    featured: project.featured ?? index < 3,
    sort_order: project.sortOrder ?? index,
    published: project.published ?? true,
    updated_at: new Date().toISOString(),
  }
}

const admin = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

const rows = ALL_PROJECTS.map(toRow)
const { error } = await admin.from('portfolio_projects').upsert(rows)
if (error && /repo_public|timeline_date/i.test(error.message || '')) {
  const legacy = rows.map(({ repo_public: _a, timeline_date: _b, ...rest }) => rest)
  const retry = await admin.from('portfolio_projects').upsert(legacy)
  if (retry.error) {
    console.error(retry.error)
    process.exit(1)
  }
} else if (error) {
  console.error(error)
  process.exit(1)
}

const { data, error: readErr } = await admin
  .from('portfolio_projects')
  .select('id, title, published, featured, sort_order')
  .order('sort_order')

if (readErr) {
  console.error(readErr)
  process.exit(1)
}

console.log(JSON.stringify({ seeded: rows.length, rows: data }, null, 2))
