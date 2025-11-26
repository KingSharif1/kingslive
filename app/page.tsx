"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ContactForm } from "@/components/ContactForm"
import { AnimatePresence } from "framer-motion"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export default function Home() {
  const [isDark, setIsDark] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const sectionsRef = useRef<(HTMLElement | null)[]>([null, null, null, null])

  useEffect(() => {
    setMounted(true)
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDark(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    }

    // Add mouse move handler for dot effect
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      document.body.style.setProperty('--mouse-x', `${x}%`)
      document.body.style.setProperty('--mouse-y', `${y}%`)
    }

    window.addEventListener('mousemove', handleMouseMove)
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
          console.log(
            `Section ${entry.target.id}:`,
            entry.isIntersecting ? 'entering' : 'leaving',
            'ratio:', entry.intersectionRatio
          )
          
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
            console.log('Setting active section to:', entry.target.id)
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
        console.log('Observing section:', sectionId)
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
              className={`w-2 h-8 rounded-full transition-all duration-500 ${
                activeSection === section ? "bg-foreground" : "bg-ring hover:bg-muted-foreground"
              }`}
              aria-label={`Navigate to ${section}`}
            />
          ))}
        </div>
      </nav>

      {/* Header */}
      <Header isDark={isDark} toggleTheme={toggleTheme} />

      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-16 pt-16 backdrop-blur-sm backdrop-brightness-150">
        <header
          id="intro"
          ref={(el) => { sectionsRef.current[0] = el; }}
          className="min-h-screen flex items-center bg-opacity-95"
        >
          <div className="grid lg:grid-cols-5 gap-12 sm:gap-16 w-full">
            <div className="lg:col-span-3 space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-2">
                <div className="text-sm text-muted-foreground font-mono tracking-wider">PORTFOLIO / 2025</div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight">
                  King
                  <br />
                  <span className="text-muted-foreground">Sharif</span>
                </h1>
              </div>

              <div className="space-y-6 max-w-md">
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
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

            <div className="lg:col-span-2 flex flex-col justify-end space-y-6 sm:space-y-8 mt-8 lg:mt-0">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground font-mono">EXPERTISE</div>
                <div className="flex flex-wrap gap-2">
                  {["React", "Next.js", "TypeScript", "Tailwind CSS", "Full Stack"].map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 text-xs border border-border rounded-full hover:border-muted-foreground/50 transition-colors duration-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-muted-foreground font-mono">BASED IN</div>
                <div className="text-foreground">Texas</div>
              </div>
            </div>
          </div>
        </header>

        <section
          id="projects"
          ref={(el) => { sectionsRef.current[1] = el; }}
          className="min-h-screen py-20 sm:py-32 opacity-95"
        >
          <div className="space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-light">Featured Projects</h2>
              <div className="text-sm text-muted-foreground font-mono">2022 — 2025</div>
            </div>

            <div className="space-y-8">
              {[
                {
                  title: 'NEMT Billing',
                  period: 'Jan 2024',
                  description: 'A modern web application I built with Next.js and Strapi to streamline billing for non-emergency medical transportation, featuring secure payment integration, automated invoice generation, and user authentication.',
                  image: '/nemtbiling.png',
                  tech: ['Next.js', 'Strapi', 'Context API', 'TypeScript'],
                  liveUrl: 'https://nemtbiling.com'
                },
                {
                  title: 'My Sweet Emporium',
                  period: 'Jan 2024',
                  description: 'An exotic candy e-commerce website offering unique and international sweets. Features modern design, inventory management, and seamless checkout experience.',
                  image: '/se-update.png',
                  tech: ['WordPress', 'WooCommerce', 'E-commerce'],
                  liveUrl: 'https://mysweetemporium.com'
                },
                {
                  title: 'Come And Take It Collectibles',
                  period: 'Aug 2022',
                  description: 'A professional e-commerce platform specializing in rare coins, collectibles, and silver rounds. Features include secure payments, product categorization, and detailed numismatic descriptions.',
                  image: '/coins-store.png',
                  tech: ['WordPress', 'WooCommerce', 'E-commerce', 'SEO'],
                  liveUrl: 'https://comeandtakeitcollectibles.com'
                }
              ].map((project) => (
                <div
                  key={project.title}
                  className="group grid lg:grid-cols-12 gap-4 sm:gap-8 py-6 sm:py-8 border-b border-border/50 hover:border-border transition-colors duration-500"
                >
                  <div className="lg:col-span-2">
                    <div className="text-xl sm:text-2xl font-light text-muted-foreground group-hover:text-foreground transition-colors duration-500">
                      {project.period}
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-medium">{project.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed max-w-lg">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 text-xs border border-border rounded-full text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-4 relative aspect-[4/3] overflow-hidden rounded-lg border border-border group-hover:border-muted-foreground/50 transition-all duration-500">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        Visit Site
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="skills"
          ref={(el) => { sectionsRef.current[2] = el; }}
          className="min-h-screen py-20 sm:py-32 opacity-95"
        >
          <div className="space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-light">Skills & Expertise</h2>
              <div className="text-sm text-muted-foreground font-mono">FULL STACK DEVELOPER</div>
            </div>

            <div className="grid gap-12">
              {[
                {
                  title: 'Frontend Development',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8l-4 4 4 4M17 8l4 4-4 4M13 5l-2 14" />
                    </svg>
                  ),
                  skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'UI/UX Design', 'Responsive Design'],
                  description: 'Building modern, responsive web applications with a focus on performance and user experience.'
                },
                {
                  title: 'Backend Development',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  ),
                  skills: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST APIs', 'GraphQL'],
                  description: 'Creating scalable server-side solutions and robust database architectures.'
                },
                {
                  title: 'DevOps & Tools',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  skills: ['Git', 'Docker', 'CI/CD', 'AWS', 'Testing', 'Performance'],
                  description: 'Implementing efficient development workflows and deployment strategies.'
                }
              ].map((category) => (
                <div
                  key={category.title}
                  className="group space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-muted transition-colors duration-300">
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-medium group-hover:text-primary transition-colors duration-300">
                        {category.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {category.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 text-sm border border-border rounded-lg text-muted-foreground group-hover:text-foreground group-hover:border-muted-foreground transition-colors duration-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="connect" ref={(el) => { sectionsRef.current[3] = el; }} className="py-20 sm:py-32 opacity-95">
          <div className="space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-light">Let's Connect</h2>
              <div className="text-sm text-muted-foreground font-mono">GET IN TOUCH</div>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                  Interested in collaborating on interesting projects or discussing web development?
                </p>
                <button
                  onClick={() => setShowContactForm(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Let's Talk
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://github.com/KingSharif1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-4 border border-border rounded-lg hover:border-muted-foreground/50 transition-all duration-300 hover:shadow-sm flex items-center gap-4"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
                  </svg>
                  <div className="flex-1">
                    <div className="text-foreground group-hover:text-primary transition-colors duration-300 font-medium">GitHub</div>
                    <div className="text-sm text-muted-foreground">@KingSharif1</div>
                  </div>
                </a>

                <a
                  href="https://linkedin.com/in/king-sharif/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-4 border border-border rounded-lg hover:border-muted-foreground/50 transition-all duration-300 hover:shadow-sm flex items-center gap-4"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <div className="flex-1">
                    <div className="text-foreground group-hover:text-primary transition-colors duration-300 font-medium">LinkedIn</div>
                    <div className="text-sm text-muted-foreground">@king-sharif</div>
                  </div>
                </a>
              </div>

              <AnimatePresence>
                {showContactForm && (
                  <div className="overflow-hidden">
                    <ContactForm onClose={() => setShowContactForm(false)} />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <Footer />
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none"></div>
    </div>
  )
}
