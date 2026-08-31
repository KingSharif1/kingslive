'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ARCHIVE_PROJECTS,
  FEATURED_PROJECTS,
  formatMonthYear,
  formatTimelineLabel,
  getGithubRepoPath,
  showGithubLink,
  splitFeaturedArchive,
  type PortfolioProject,
} from '@/lib/portfolio-projects'

type RepoStats = {
  public: boolean
  commitCount: number | null
  lastCommitAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

function usePublicRepoStats(projects: PortfolioProject[]) {
  const [stats, setStats] = useState<Record<string, RepoStats>>({})
  const [waiting, setWaiting] = useState(true)

  const publicRepos = useMemo(
    () =>
      projects
        .filter(showGithubLink)
        .map((p) => getGithubRepoPath(p.repoUrl))
        .filter((p): p is string => Boolean(p)),
    [projects]
  )

  useEffect(() => {
    let cancelled = false
    if (!publicRepos.length) {
      setWaiting(false)
      return
    }

    setWaiting(true)
    ;(async () => {
      const entries = await Promise.all(
        publicRepos.map(async (repo) => {
          try {
            const res = await fetch(`/api/github/repo-stats?repo=${encodeURIComponent(repo)}`)
            if (!res.ok) return [repo, null] as const
            const data = (await res.json()) as RepoStats
            return [repo, data] as const
          } catch {
            return [repo, null] as const
          }
        })
      )
      if (cancelled) return
      const next: Record<string, RepoStats> = {}
      for (const [repo, data] of entries) {
        if (data?.public) next[repo] = data
      }
      setStats(next)
      setWaiting(false)
    })()

    return () => {
      cancelled = true
    }
  }, [publicRepos.join('|')])

  return { stats, waiting }
}

function RepoMeta({ stats, waiting }: { stats?: RepoStats; waiting?: boolean }) {
  if (waiting && !stats) {
    return <p className="wait-copy text-[11px] font-mono text-muted-foreground/70 pt-1">Fetching commits…</p>
  }
  if (!stats?.public) return null
  const commits =
    stats.commitCount != null ? stats.commitCount.toLocaleString() : null
  const created = formatMonthYear(stats.createdAt)
  const updated = formatMonthYear(stats.updatedAt || stats.lastCommitAt)
  const bits = [
    commits ? `${commits} commits` : null,
    created ? `created ${created}` : null,
    updated && updated !== created ? `updated ${updated}` : null,
  ].filter(Boolean)

  if (!bits.length) return null
  return <p className="text-[11px] font-mono text-muted-foreground/80 pt-1">{bits.join(' · ')}</p>
}

function ProjectRow({
  project,
  index,
  stats,
  waiting,
}: {
  project: PortfolioProject
  index: number
  stats?: RepoStats
  waiting?: boolean
}) {
  const isLive = project.status === 'Deployed'
  const num = String(index + 1).padStart(2, '0')

  return (
    <div
      data-projects-layout="rows"
      className="group grid lg:grid-cols-12 gap-6 sm:gap-10 py-10 sm:py-14 border-b border-border/50 hover:border-border transition-colors duration-500"
    >
      <div className="lg:col-span-2 space-y-3">
        <span className="text-4xl sm:text-5xl font-light font-sora text-muted-foreground/70 tabular-nums">
          {num}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>{project.year}</span>
          <span
            className={`inline-flex items-center gap-1.5 ${
              isLive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isLive ? 'Live' : project.status}
          </span>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-4">
        <h3 className="text-2xl sm:text-3xl font-medium font-sora tracking-tight">{project.title}</h3>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-[10px] tracking-wide uppercase font-mono rounded-full border border-border/60 text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 decoration-foreground/25 hover:decoration-foreground transition-colors"
            >
              Live
            </a>
          )}
          {showGithubLink(project) && project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          )}
          {project.blogSlug && (
            <Link href={`/blog/${project.blogSlug}`} className="text-muted-foreground hover:text-foreground transition-colors">
              Writing
            </Link>
          )}
        </div>
        <RepoMeta stats={stats} waiting={waiting} />
      </div>

      <div className="lg:col-span-5">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border/40 bg-muted/20">
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(max-width: 1024px) 100vw, 420px"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
            quality={85}
            unoptimized={project.image.startsWith('http')}
          />
        </div>
        <p className="mt-2 text-[11px] font-mono text-muted-foreground/70 truncate">
          {formatTimelineLabel(project)}
        </p>
      </div>
    </div>
  )
}

export function ProjectsSection({ projects }: { projects?: PortfolioProject[] }) {
  const [showAll, setShowAll] = useState(false)
  const loading = projects === undefined

  const source = projects ?? [...FEATURED_PROJECTS, ...ARCHIVE_PROJECTS]
  const { featured, archive } = splitFeaturedArchive(source)
  const rest = archive
  const visible = showAll ? [...featured, ...rest] : featured
  const { stats, waiting } = usePublicRepoStats(loading ? [] : source)

  const statsFor = (p: PortfolioProject) => {
    const path = getGithubRepoPath(p.repoUrl)
    return path ? stats[path] : undefined
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h2 className="text-3xl sm:text-4xl font-light font-sora tracking-tight">Projects</h2>
        <div className="text-sm text-muted-foreground font-mono">2024 — 2026</div>
      </div>

      <div className="space-y-0">
        {loading
          ? [0, 1, 2].map((i) => (
              <div
                key={i}
                className="grid lg:grid-cols-12 gap-6 sm:gap-10 py-10 sm:py-14 border-b border-border/50"
                aria-hidden
              >
                <div className="lg:col-span-2 space-y-3">
                  <div className="wait-block h-12 w-14" />
                  <div className="wait-block h-3 w-20" />
                </div>
                <div className="lg:col-span-5 space-y-3">
                  <div className="wait-block h-7 w-2/3" />
                  <div className="wait-block h-4 w-full" />
                  <div className="wait-block h-4 w-5/6" />
                </div>
                <div className="lg:col-span-5">
                  <div className="wait-block aspect-[16/10] w-full rounded-xl" />
                </div>
              </div>
            ))
          : visible.map((project, i) => (
              <ProjectRow
                key={project.id}
                project={project}
                index={i}
                stats={statsFor(project)}
                waiting={waiting}
              />
            ))}
      </div>

      {!loading && rest.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-mono tracking-wide uppercase rounded-full border border-border/70 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            aria-expanded={showAll}
          >
            {showAll ? 'Show highlights' : `Load all projects (${source.length})`}
            <svg
              className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
