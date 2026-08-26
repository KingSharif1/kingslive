"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { ProjectsSection } from "@/components/ProjectsSection"
import { SkillsSection } from "@/components/SkillsSection"
import { getPublishedPosts, BlogPost } from "@/lib/sanity-queries"

// Lazy load heavy components
const ContactForm = dynamic(() => import("@/components/ContactForm").then(mod => ({ default: mod.ContactForm })), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-muted-foreground">Loading form...</div>
})

export default function Home() {
  const [isDark, setIsDark] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const sectionsRef = useRef<(HTMLElement | null)[]>([null, null, null, null])

  useEffect(() => {
    setMounted(true)
    
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDark(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    }

    // Fetch blog posts
    getPublishedPosts().then(posts => {
      setBlogPosts(posts.slice(0, 2)) // Get latest 2 posts
    }).catch(console.error)

    // Throttled mouse move handler for dot effect
    let lastMove = 0
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastMove < 50) return // Throttle to 20fps max
      lastMove = now
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      document.body.style.setProperty('--mouse-x', `${x}%`)
      document.body.style.setProperty('--mouse-y', `${y}%`)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('darkMode', String(isDark))
      document.documentElement.classList.toggle('dark', isDark)
    }
  }, [isDark, mounted])

  useEffect(() => {
    // console.log('Active section changed to:', activeSection)
  }, [activeSection])

  useEffect(() => {
    if (!mounted) return;

    // console.log('Setting up observer after mount');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // console.log(
          //   `Section ${entry.target.id}:`,
          //   entry.isIntersecting ? 'entering' : 'leaving',
          //   'ratio:', entry.intersectionRatio
          // )

          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
            // console.log('Setting active section to:', entry.target.id)
          }
        })
      },
      { threshold: 0.5 }
    )

    // Initialize sections array
    const sections = ['intro', 'projects', 'skills', 'connect']
    sections.forEach((sectionId, index) => {
      const element = document.getElementById(sectionId)
      if (element) {
        sectionsRef.current[index] = element
        observer.observe(element)
        // console.log('Observing section:', sectionId)
      } else {
        console.warn('Section not found:', sectionId)
      }
    })

    // Set initial active section based on scroll position
    const setInitialSection = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2
      for (const section of sectionsRef.current) {
        if (section) {
          const { top, bottom } = section.getBoundingClientRect()
          if (top <= window.innerHeight / 2 && bottom >= window.innerHeight / 2) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }
    setInitialSection()

    return () => observer.disconnect()
  }, [mounted])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background/30 text-foreground relative">
      <nav className="fixed left-8 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
        <div className="flex flex-col gap-4">
          {["intro", "projects", "skills", "connect"].map((section) => (
            <button
              key={section}
              onClick={() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" })}
              className={`w-2 h-8 rounded-full transition-all duration-500 ${activeSection === section ? "bg-foreground" : "bg-ring hover:bg-muted-foreground"
                }`}
              aria-label={`Navigate to ${section}`}
            />
          ))}
        </div>
      </nav>

      {/* Header */}
      <Header isDark={isDark} toggleTheme={toggleTheme} />

      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-16 pt-16 backdrop-blur-sm bg-background/20 backdrop-brightness-60 dark:backdrop-grayscale-100 dark:backdrop-brightness-50 dark:backdrop-blur-sm">
        <header
          id="intro"
          ref={(el) => { sectionsRef.current[0] = el; }}
          className="min-h-screen flex items-center bg-opacity-95"
        >
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
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Open to opportunities
                  </div>
                  <div>Web Developer</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col justify-center space-y-8 mt-8 lg:mt-0">
              <div className="p-6 rounded-2xl bg-accent/20 backdrop-blur-sm space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-muted-foreground font-mono tracking-wider">BASED IN</span>
                  </div>
                  <div className="text-lg font-jakarta font-medium text-foreground">Texas, USA</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section
          id="projects"
          ref={(el) => { sectionsRef.current[1] = el; }}
          className="min-h-screen py-20 sm:py-32 opacity-100"
        >
          <ProjectsSection />
        
        </section>

        {/* Featured Blog Posts Section */}
        <section className="py-20 sm:py-32">
          <div className="space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-light font-outfit">Latest from the Blog</h2>
              <Link 
                href="/blog" 
                className="text-sm text-muted-foreground font-mono hover:text-foreground transition-colors flex items-center gap-2"
              >
                VIEW ALL POSTS
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {blogPosts.length > 0 ? blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group p-6 rounded-2xl border border-border bg-card/50 shadow-sm hover:shadow-md hover:border-foreground/20 hover:bg-accent/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {post.tags[0] && (
                      <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {post.tags[0]}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium font-outfit mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-roboto line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Read more
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              )) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <p>No blog posts yet. Check back soon!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          id="skills"
          ref={(el) => { sectionsRef.current[2] = el; }}
          className="py-20 sm:py-32 opacity-95"
        >
          <SkillsSection />
        
        </section>


        <section id="connect" ref={(el) => { sectionsRef.current[3] = el; }} className="py-20 sm:py-32 opacity-95">
          <div className="space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-light font-outfit">Let's Connect</h2>
              <div className="text-sm text-muted-foreground font-mono">GET IN TOUCH</div>
            </div>

            <div className="relative">
              {/* Gradient background accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-3xl -z-10" />

              <div className="p-8 sm:p-12 rounded-3xl border border-border/50 backdrop-blur-sm">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-2xl sm:text-3xl font-light font-outfit">
                      Have a project in mind?
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed font-roboto">
                      I'm always open to discussing new opportunities, creative ideas, or just having a friendly chat about web development.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowContactForm(true)
                      setTimeout(() => {
                        document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 150)
                    }}
                    className="group relative px-8 py-4 rounded-full font-medium text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-105"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary" />
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative flex items-center gap-2">
                      Start a Conversation
                      <svg className="w-4 h-4 transform group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </span>
                  </button>
                </div>

                <div className="mt-12 pt-8 border-t border-border/50">
                  <p className="text-center text-sm text-muted-foreground mb-6">Or find me on</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <a
                      href="https://github.com/KingSharif1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-accent/50 hover:bg-accent border border-transparent hover:border-border transition-all duration-300"
                    >
                      <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                      </svg>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">GitHub</span>
                    </a>

                    <a
                      href="https://linkedin.com/in/king-sharif/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-accent/50 hover:bg-accent border border-transparent hover:border-border transition-all duration-300"
                    >
                      <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">LinkedIn</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {showContactForm && (
              <div id="contact-form" className="overflow-hidden">
                <ContactForm onClose={() => setShowContactForm(false)} />
              </div>
            )}
          </div>
        </section>


        <Footer />
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none"></div>
    </div>
  )
}
