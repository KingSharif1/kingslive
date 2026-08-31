import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { PortfolioProject } from '@/lib/portfolio-projects'
import { projectToRow, rowToProject, type PortfolioProjectRow } from '@/app/ctroom/services/portfolioProjectRow'
import { verifyAdminAuth } from '../middleware'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Admin list — all rows, including unpublished */
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authorized) return auth.response

  const { data, error } = await adminClient()
    .from('portfolio_projects')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    const missing =
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      /portfolio_projects/i.test(error.message)
    return NextResponse.json(
      { error: error.message, tableMissing: missing, projects: [] },
      { status: missing ? 409 : 500 }
    )
  }

  return NextResponse.json({
    projects: (data || []).map((row) => rowToProject(row as PortfolioProjectRow)),
    tableMissing: false,
  })
}

/** Admin create/update */
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authorized) return auth.response

  const project = (await request.json()) as PortfolioProject
  if (!project?.id || !project.title) {
    return NextResponse.json({ error: 'id and title are required' }, { status: 400 })
  }

  const row = projectToRow(project)
  let { data, error } = await adminClient()
    .from('portfolio_projects')
    .upsert(row)
    .select('*')
    .single()

  if (error && /repo_public|timeline_date/i.test(error.message || '')) {
    const { repo_public: _rp, timeline_date: _td, ...legacy } = row
    const retry = await adminClient().from('portfolio_projects').upsert(legacy).select('*').single()
    data = retry.data
    error = retry.error
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ project: rowToProject(data as PortfolioProjectRow) })
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAuth(request)
  if (!auth.authorized) return auth.response

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await adminClient().from('portfolio_projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
