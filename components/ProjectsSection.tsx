'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ARCHIVE_PROJECTS,
  FEATURED_PROJECTS,
  formatTimelineLabel,
  getFeaturedHighlights,
  getGithubRepoPath,
  getInProgressByTimeline,
  showGithubLink,
  sortProjectsByTimeline,
  type PortfolioProject,
} from '@/lib/portfolio-projects'

type RepoStats = {
  public: boolean
  commitCount: number | null
  lastCommitAt: string | null
  lastCommitMessage: string | null
}

function usePublicRepoStats(projects: PortfolioProject[]) {
  const [stats, setStats] = useState<Record<string, RepoStats>>({})

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
    if (!publicRepos.length) return

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
    })()

    return () => {
      cancelled = true
    }
  }, [publicRepos.join('|')])

  return stats
}

function formatRelative(iso: string | null): string | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  const days = Math.round((Date.now() - then) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}

function HighlightCard({ project, stats }: { project: PortfolioProject; stats?: RepoStats }) {
  const repoPath = getGithubRepoPath(project.repoUrl)
  const isLive = project.status === 'Deployed'

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/50 bg-foreground/[0.02] hover:border-foreground/25 transition-all duration-500">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/20">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03] opacity-90 group-hover:opacity-100"
          quality={80}
          unoptimized={project.image.startsWith('http')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-foreground/80">{formatTimelineLabel(project)}</span>
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
              isLive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {project.status}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-3">
        <h3 className="text-lg font-medium font-sora tracking-tight">{project.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{project.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {project.tech.slice(0, 4).map((tech) => (
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

        {stats?.public && (
          <p className="text-[11px] font-mono text-muted-foreground/80 pt-1">
            {stats.commitCount != null ? `${stats.commitCount.toLocaleString()} commits` : 'Public repo'}
            {stats.lastCommitAt ? ` · updated ${formatRelative(stats.lastCommitAt)}` : ''}
          </p>
        )}
        {stats?.lastCommitMessage && (
          <p className="text-[11px] text-muted-foreground/70 line-clamp-1" title={stats.lastCommitMessage}>
            {stats.lastCommitMessage}
          </p>
        )}
        {!stats && repoPath && showGithubLink(project) ? (
          <p className="text-[11px] font-mono text-muted-foreground/50">Loading repo activity…</p>
        ) : null}
      </div>
    </article>
  )
}

function TimelineItem({
  project,
  stats,
  isLast,
}: {
  project: PortfolioProject
  stats?: RepoStats
  isLast: boolean
}) {
  const isLive = project.status === 'Deployed'

  return (
    <li className="relative grid grid-cols-[5.5rem_1fr] sm:grid-cols-[7rem_1fr] gap-4 sm:gap-6">
      <div className="pt-1 text-right">
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {formatTimelineLabel(project)}
        </span>
      </div>

      <div className={`relative pl-5 sm:pl-6 pb-10 ${isLast ? 'pb-2' : ''}`}>
        <span
          className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full border-2 border-background bg-foreground/70 ring-2 ring-border/60"
          aria-hidden
        />
        {!isLast && (
          <span className="absolute left-[4px] top-5 bottom-0 w-px bg-border/70" aria-hidden />
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-medium font-sora">{project.title}</h3>
            <span
              className={`text-[11px] font-medium ${
                isLive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {project.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{project.description}</p>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {project.tech.map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 text-[10px] tracking-wide uppercase font-mono rounded-full border border-border/60 text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm pt-1">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 decoration-foreground/25 hover:decoration-foreground"
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
              <Link href={`/blog/${project.blogSlug}`} className="text-muted-foreground hover:text-foreground">
                Writing
              </Link>
            )}
          </div>
          {stats?.public && (
            <p className="text-[11px] font-mono text-muted-foreground/80">
              {stats.commitCount != null ? `${stats.commitCount.toLocaleString()} commits` : 'Public repo'}
              {stats.lastCommitAt ? ` · ${formatRelative(stats.lastCommitAt)}` : ''}
              {stats.lastCommitMessage ? ` · ${stats.lastCommitMessage}` : ''}
            </p>
          )}
        </div>
      </div>
    </li>
  )
}

export function ProjectsSection({ projects }: { projects?: PortfolioProject[] }) {
  const [showAll, setShowAll] = useState(false)

  const source = projects?.length ? projects : [...FEATURED_PROJECTS, ...ARCHIVE_PROJECTS]
  const highlights = getFeaturedHighlights(source)
  const highlightIds = new Set(highlights.map((p) => p.id))
  const inProgress = getInProgressByTimeline(source)
  const timeline = sortProjectsByTimeline(source)
  const stats = usePublicRepoStats(source)

  const statsFor = (p: PortfolioProject) => {
    const path = getGithubRepoPath(p.repoUrl)
    return path ? stats[path] : undefined
  }

  return (
    <div className="space-y-14 sm:space-y-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-light font-sora tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Three highlights up front. Open the full timeline for everything in order.
          </p>
        </div>
        <div className="text-sm text-muted-foreground font-mono">2025 — 2026</div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {highlights.map((project) => (
          <HighlightCard key={project.id} project={project} stats={statsFor(project)} />
        ))}
      </div>

      {!showAll && inProgress.length > 0 && (
        <div className="space-y-5">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            In progress
          </h3>
          <ul className="space-y-0">
            {inProgress.map((project, i) => (
              <TimelineItem
                key={project.id}
                project={project}
                stats={statsFor(project)}
                isLast={i === inProgress.length - 1}
              />
            ))}
          </ul>
        </div>
      )}

      {showAll && (
        <div className="space-y-6 pt-2">
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Full timeline
          </h3>
          <ul>
            {timeline.map((project, i) => (
              <TimelineItem
                key={`timeline-${project.id}`}
                project={project}
                stats={statsFor(project)}
                isLast={i === timeline.length - 1}
              />
            ))}
          </ul>
        </div>
      )}

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

      {!showAll && highlightIds.size < source.length && (
        <p className="text-center text-xs text-muted-foreground font-mono">
          +{source.length - highlights.length} more on the timeline
        </p>
      )}
    </div>
  )
}
