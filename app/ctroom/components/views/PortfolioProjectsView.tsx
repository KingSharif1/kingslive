'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Github, RefreshCw, Database } from 'lucide-react'
import type { PortfolioProject } from '@/lib/portfolio-projects'
import { PortfolioProjectsService } from '../../services/portfolioProjectsService'
import { PortfolioProjectFormModal } from '../modals/PortfolioProjectFormModal'

const MIGRATION_HINT = `Run in Supabase SQL Editor (kinglive cms):

See supabase/migrations/20260826_create_portfolio_projects.sql
Then click “Seed from defaults” here.`

export function PortfolioProjectsView() {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [tableMissing, setTableMissing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PortfolioProject | null>(null)
  const [seeding, setSeeding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { projects: rows, tableMissing: missing } = await PortfolioProjectsService.listAll()
      setProjects(rows)
      setTableMissing(missing)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSaved = (project: PortfolioProject) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = project
        return next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      }
      return [...prev, project].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    })
    setTableMissing(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete project “${id}”?`)) return
    try {
      await PortfolioProjectsService.remove(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    setError(null)
    try {
      // Prefer service-role bootstrap when available
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const res = await fetch('/api/ctroom/portfolio/bootstrap', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const body = await res.json()
        if (res.status === 409 && body.needsMigration) {
          setError('Create the table first — open supabase/migrations/20260826_create_portfolio_projects.sql in the Supabase SQL Editor, run it, then Seed again.')
          setTableMissing(true)
          return
        }
        if (!res.ok) throw new Error(body.error || 'Seed failed')
      } else {
        await PortfolioProjectsService.seedFromStatic()
      }
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Seed failed — create the table first')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6 text-white max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35 mb-2">
            Public site
          </p>
          <h1 className="font-display text-3xl text-white">Portfolio projects</h1>
          <p className="text-sm text-white/45 mt-2 max-w-lg">
            Edit what shows on kingsharif.com — featured top 3, archive, GitHub links, website URLs, covers, and skills.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding || tableMissing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white disabled:opacity-40"
          >
            <Database className="w-3.5 h-3.5" />
            {seeding ? 'Seeding…' : 'Seed defaults'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00ff88]/15 border border-[#00ff88]/35 text-xs font-mono uppercase tracking-wider text-[#00ff88]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add project
          </button>
        </div>
      </div>

      {tableMissing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100/90 whitespace-pre-wrap font-mono">
          {MIGRATION_HINT}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-white/40 text-sm">Loading projects…</p>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => {
            const deployed = project.status === 'Deployed'
            return (
              <div
                key={project.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.03]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt=""
                  className="w-full sm:w-28 h-20 object-cover rounded-lg border border-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-white truncate">{project.title}</h3>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        deployed
                          ? 'border-emerald-500/40 text-emerald-400'
                          : 'border-amber-500/40 text-amber-400'
                      }`}
                    >
                      {project.status}
                    </span>
                    {project.featured && (
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#00ff88]/35 text-[#00ff88]">
                        Featured
                      </span>
                    )}
                    {project.published === false && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/35">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/45 line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-white/40">
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
                        <ExternalLink className="w-3 h-3" /> Website
                      </a>
                    )}
                    {project.repoUrl && (
                      <a href={project.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">
                        <Github className="w-3 h-3" /> Repo
                      </a>
                    )}
                    <span className="font-mono">{project.tech.join(' · ')}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(project)
                      setModalOpen(true)
                    }}
                    className="p-2 rounded-lg border border-white/10 text-white/60 hover:text-white"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PortfolioProjectFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        initial={editing}
      />
    </div>
  )
}
