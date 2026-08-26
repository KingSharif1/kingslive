'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ARCHIVE_PROJECTS,
  FEATURED_PROJECTS,
  splitFeaturedArchive,
  type PortfolioProject,
} from '@/lib/portfolio-projects'

function ProjectRow({ project, index }: { project: PortfolioProject; index: number }) {
  const isDeployed = project.status === 'Deployed'

  return (
    <article className="group grid lg:grid-cols-12 gap-5 sm:gap-8 py-7 sm:py-9 border-b border-border/40 hover:border-foreground/25 transition-colors duration-500">
      <div className="lg:col-span-2 flex flex-col gap-2">
        <span className="text-3xl sm:text-4xl font-light text-foreground/90 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{project.year}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isDeployed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className={`text-xs font-medium ${isDeployed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {project.status}
          </span>
        </div>
      </div>

      <div className="lg:col-span-6 space-y-3">
        <h3 className="text-lg sm:text-xl font-medium font-sora">{project.title}</h3>
        <p className="text-muted-foreground leading-relaxed max-w-lg text-[15px]">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 text-[11px] tracking-wide uppercase font-mono border border-border/70 text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 decoration-foreground/25 hover:decoration-foreground transition-colors"
            >
              Website
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          )}
          {project.blogSlug ? (
            <Link
              href={`/blog/${project.blogSlug}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Related writing
            </Link>
          ) : (
            <Link
              href={`/blog?project=${project.id}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Posts about this
            </Link>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 relative aspect-[4/3] overflow-hidden border border-border/60 group-hover:border-foreground/30 transition-all duration-500 bg-muted/20">
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          loading={index === 0 ? 'eager' : 'lazy'}
          priority={index === 0}
          quality={80}
          unoptimized={project.image.startsWith('http')}
        />
      </div>
    </article>
  )
}

export function ProjectsSection({ projects }: { projects?: PortfolioProject[] }) {
  const { featured, archive } = projects?.length
    ? splitFeaturedArchive(projects)
    : { featured: FEATURED_PROJECTS, archive: ARCHIVE_PROJECTS }

  const total = featured.length + archive.length

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-light font-sora tracking-tight">Featured Projects</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Three highlights from GitHub — open the archive for the full set.
          </p>
        </div>
        <div className="text-sm text-muted-foreground font-mono">2025 — 2026</div>
      </div>

      <div className="space-y-2">
        {featured.map((project, index) => (
          <ProjectRow key={project.id} project={project} index={index} />
        ))}
      </div>

      {archive.length > 0 && (
        <details className="group border border-border/60 open:border-foreground/25 transition-colors">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 text-sm font-mono tracking-wide uppercase text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors [&::-webkit-details-marker]:hidden">
            <span>All projects ({total}) · show archive</span>
            <svg
              className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="border-t border-border/40 px-0">
            {archive.map((project, index) => (
              <ProjectRow
                key={project.id}
                project={project}
                index={featured.length + index}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
