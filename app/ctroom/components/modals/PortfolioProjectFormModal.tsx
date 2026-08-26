'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, Github, Search, Loader2, ImagePlus, Check } from 'lucide-react'
import type { PortfolioProject } from '@/lib/portfolio-projects'
import { PortfolioProjectsService } from '../../services/portfolioProjectsService'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: (project: PortfolioProject) => void
  initial?: PortfolioProject | null
}

interface GithubRepo {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  language: string | null
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export function PortfolioProjectFormModal({ isOpen, onClose, onSaved, initial }: Props) {
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [status, setStatus] = useState<PortfolioProject['status']>('In Progress')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('/hireiq-cover.png')
  const [techText, setTechText] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [blogSlug, setBlogSlug] = useState('')
  const [featured, setFeatured] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)
  const [published, setPublished] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showRepoPicker, setShowRepoPicker] = useState(false)
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [reposLoading, setReposLoading] = useState(false)
  const [repoSearch, setRepoSearch] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setId(initial?.id || '')
    setTitle(initial?.title || '')
    setYear(initial?.year || String(new Date().getFullYear()))
    setStatus(initial?.status || 'In Progress')
    setDescription(initial?.description || '')
    setImage(initial?.image || '/hireiq-cover.png')
    setTechText((initial?.tech || []).join(', '))
    setLiveUrl(initial?.liveUrl || '')
    setRepoUrl(initial?.repoUrl || '')
    setBlogSlug(initial?.blogSlug || '')
    setFeatured(initial?.featured ?? false)
    setSortOrder(initial?.sortOrder ?? 0)
    setPublished(initial?.published ?? true)
    setError(null)
  }, [isOpen, initial])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowRepoPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadRepos = async () => {
    setReposLoading(true)
    try {
      const res = await fetch('/api/ctroom/github/repos')
      const data = await res.json()
      setRepos(data.repos || [])
    } catch {
      setRepos([])
    } finally {
      setReposLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const url = await PortfolioProjectsService.uploadCover(file)
      setImage(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    const cleanId = (id || slugify(title)).trim()
    if (!cleanId || !title.trim()) {
      setError('Title and id are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const project: PortfolioProject = {
        id: cleanId,
        title: title.trim(),
        year: year.trim(),
        status,
        description: description.trim(),
        image: image.trim() || '/hireiq-cover.png',
        tech: techText.split(',').map((t) => t.trim()).filter(Boolean),
        liveUrl: liveUrl.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        blogSlug: blogSlug.trim() || undefined,
        featured,
        sortOrder: Number(sortOrder) || 0,
        published,
      }
      const saved = await PortfolioProjectsService.upsert(project)
      onSaved(saved)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed — is the portfolio_projects table created?')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const filteredRepos = repos.filter((r) =>
    !repoSearch || r.name.toLowerCase().includes(repoSearch.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 p-5 space-y-4"
        style={{ background: '#111' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm uppercase tracking-widest text-white">
            {initial ? 'Edit project' : 'New project'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 space-y-1">
            <span className="text-[10px] font-mono uppercase text-white/40">Title</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!initial) setId(slugify(e.target.value))
              }}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#00ff88]/40"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-white/40">ID (slug)</span>
            <input
              value={id}
              disabled={!!initial}
              onChange={(e) => setId(slugify(e.target.value))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none disabled:opacity-50"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-white/40">Year</span>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase text-white/40">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none resize-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-white/40">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PortfolioProject['status'])}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="Deployed">Deployed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-white/40">Sort order</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase text-white/40">Skills / tech (comma-separated)</span>
          <input
            value={techText}
            onChange={(e) => setTechText(e.target.value)}
            placeholder="Next.js, TypeScript, Supabase"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
          />
        </label>

        <div className="grid grid-cols-1 gap-3">
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-white/40">Website URL</span>
            <input
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
            />
          </label>

          <div className="space-y-1 relative" ref={pickerRef}>
            <span className="text-[10px] font-mono uppercase text-white/40">GitHub repo</span>
            <div className="flex gap-2">
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setShowRepoPicker((v) => !v)
                  if (!repos.length) loadRepos()
                }}
                className="px-3 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-[#00ff88]/40"
                title="Pick from GitHub"
              >
                <Github className="w-4 h-4" />
              </button>
            </div>
            {showRepoPicker && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-[#151515] shadow-xl max-h-56 overflow-hidden">
                <div className="p-2 border-b border-white/10 flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-white/40" />
                  <input
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder="Search repos..."
                    className="flex-1 bg-transparent text-sm text-white outline-none"
                  />
                </div>
                <div className="overflow-y-auto max-h-44">
                  {reposLoading ? (
                    <div className="p-4 text-center text-white/40 text-sm">Loading…</div>
                  ) : filteredRepos.length === 0 ? (
                    <div className="p-4 text-center text-white/40 text-sm">No repos found</div>
                  ) : (
                    filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => {
                          setRepoUrl(repo.url)
                          if (!title) setTitle(repo.name)
                          if (!description && repo.description) setDescription(repo.description)
                          if (!id) setId(slugify(repo.name))
                          if (repo.language && !techText) setTechText(repo.language)
                          setShowRepoPicker(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm text-white/80"
                      >
                        <div className="font-medium text-white">{repo.name}</div>
                        <div className="text-xs text-white/40 truncate">{repo.description}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-white/40">Blog slug (optional)</span>
            <input
              value={blogSlug}
              onChange={(e) => setBlogSlug(e.target.value)}
              placeholder="updating-portfolio"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
            />
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase text-white/40">Cover image</span>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="w-20 h-14 object-cover rounded-lg border border-white/10" />
            <div className="flex-1 space-y-2">
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white outline-none"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00ff88]"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                Upload image
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-white/70">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Featured (top 3 area)
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Published on site
          </label>
        </div>

        {error && <p className="text-sm text-red-400 font-mono">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono uppercase tracking-wider bg-[#00ff88]/15 border border-[#00ff88]/35 text-[#00ff88] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
