import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ALL_PROJECTS } from '@/lib/portfolio-projects'
import { projectToRow } from '@/app/ctroom/services/portfolioProjectRow'
import { verifyAdminAuth } from '../../middleware'

/**
 * Bootstrap portfolio_projects table + seed.
 * Requires SUPABASE_SERVICE_ROLE_KEY. Runs migration SQL via PostgREST is not
 * possible for DDL — we attempt seed only; DDL must be applied in SQL editor
 * unless the table already exists.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authorized) return auth.response

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Missing Supabase admin credentials' }, { status: 500 })
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Try seed; if table missing, return migration SQL for the operator
  const rows = ALL_PROJECTS.map((p, i) => ({
    ...projectToRow({
      ...p,
      featured: p.featured ?? i < 3,
      sortOrder: p.sortOrder ?? i,
    }),
    created_at: new Date().toISOString(),
  }))

  let { error } = await admin.from('portfolio_projects').upsert(rows)

  if (error && /repo_public|timeline_date/i.test(error.message || '')) {
    const legacy = rows.map(({ repo_public: _a, timeline_date: _b, ...rest }) => rest)
    const retry = await admin.from('portfolio_projects').upsert(legacy)
    error = retry.error
  }

  if (error) {
    let migrationSql = ''
    try {
      migrationSql = readFileSync(
        join(process.cwd(), 'supabase/migrations/20260826_create_portfolio_projects.sql'),
        'utf8'
      )
    } catch {
      migrationSql = '-- See supabase/migrations/20260826_create_portfolio_projects.sql'
    }

    return NextResponse.json(
      {
        error: error.message,
        needsMigration: true,
        migrationSql,
      },
      { status: 409 }
    )
  }

  return NextResponse.json({ success: true, seeded: rows.length })
}
