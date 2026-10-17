import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProjectsSection } from '@/components/ProjectsSection'
import { SkillsSection } from '@/components/SkillsSection'
import { RotatingRole } from '@/components/RotatingRole'
import { ConnectSection } from '@/components/portfolio/ConnectSection'
import { PetalsGate } from '@/components/portfolio/PetalsGate'
import { SectionDots } from '@/components/portfolio/SectionDots'
import { PORTFOLIO_MAIN, PORTFOLIO_PAGE } from '@/lib/portfolio-chrome'
import { loadPortfolioNotes, loadPublishedProjects } from '@/lib/portfolio-public'

export const revalidate = 300

function noteDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function Home() {
  const [projects, notes] = await Promise.all([loadPublishedProjects(), loadPortfolioNotes(2)])

  return (
    <div className={PORTFOLIO_PAGE}>
      <PetalsGate />
      <SectionDots />

      <Header />

      <main className={PORTFOLIO_MAIN}>
        <header id="intro" className="min-h-screen flex items-center bg-opacity-95">
          <div className="grid lg:grid-cols-5 gap-12 sm:gap-16 w-full">
            <div className="lg:col-span-3 space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-2">
                <div className="text-sm text-muted-foreground font-mono tracking-wider">PORTFOLIO / 2026</div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight font-unbounded">
                  King
                  <br />
                  <span className="text-muted-foreground">Sharif</span>
                </h1>
              </div>

              <div className="space-y-6 max-w-md">
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-jakarta">
                  Full Stack Developer building innovative projects with
                  <span className="text-foreground"> modern web</span> technologies. Passionate about creating
                  <span className="text-foreground"> scalable</span> and
                  <span className="text-foreground"> user-centric</span> applications.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full motion-safe:animate-pulse"></div>
                    Open to opportunities
                  </div>
                  <RotatingRole />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col justify-center space-y-8 mt-8 lg:mt-0">
              <div className="p-6 rounded-2xl bg-accent/20 backdrop-blur-sm space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-xs text-muted-foreground font-mono tracking-wider">BASED IN</span>
                  </div>
                  <div className="text-lg font-jakarta font-medium text-foreground">Texas, USA</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section id="projects" data-projects-rev="rows" className="min-h-screen py-20 sm:py-32 opacity-100">
          <ProjectsSection projects={projects} />
        </section>

        <section className="py-20 sm:py-32">
          <div className="space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-light font-outfit">Latest from the Blog</h2>
              <Link
                href="/blog"
                prefetch={false}
                className="text-sm text-muted-foreground font-mono hover:text-foreground transition-colors flex items-center gap-2"
              >
                VIEW ALL POSTS
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="space-y-0">
              {notes.length > 0 ? (
                notes.map((post, i) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    prefetch={false}
                    className="group grid lg:grid-cols-12 gap-4 sm:gap-8 py-6 sm:py-8 border-b border-border/50 hover:border-border transition-colors duration-500"
                  >
                    <div className="lg:col-span-2">
                      <span className="text-2xl font-light font-sora text-muted-foreground/70 tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="text-xs font-mono text-muted-foreground mt-2">{noteDate(post.createdAt)}</div>
                    </div>
                    <div className="lg:col-span-10 space-y-2">
                      {post.tag && (
                        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          {post.tag}
                        </span>
                      )}
                      <h3 className="text-lg sm:text-xl font-medium font-sora">{post.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{post.excerpt}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="py-8 text-muted-foreground">No blog posts yet.</p>
              )}
            </div>
          </div>
        </section>

        <section id="skills" data-port="6" className="py-20 sm:py-32 opacity-95">
          <SkillsSection />
        </section>

        <ConnectSection />

        <Footer />
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none"></div>
    </div>
  )
}
