"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
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
  const [showAllProjects, setShowAllProjects] = useState(false)
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
                <div className="text-sm text-muted-foreground font-mono tracking-wider">PORTFOLIO / 2025</div>
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
          <div className="space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-light font-outfit">Featured Projects</h2>
              <div className="text-sm text-muted-foreground font-mono">2022 — 2025</div>
            </div>

            <div className="space-y-8">
              {[
                {
                  title: 'NEMT Billing',
                  year: '2023',
                  status: 'Live',
                  description: 'A modern web application I built with Next.js and Strapi to streamline billing for non-emergency medical transportation, featuring secure payment integration, automated invoice generation, and user authentication.',
                  image: '/nemtbiling.png',
                  tech: ['Next.js', 'Strapi', 'Context API', 'TypeScript'],
                  liveUrl: 'https://nemtbiling.com'
                },
                {
                  title: 'My Sweet Emporium',
                  year: '2024',
                  status: 'Live',
                  description: 'An exotic candy e-commerce website offering unique and international sweets. Features modern design, inventory management, and seamless checkout experience.',
                  image: '/se-update.png',
                  tech: ['WordPress', 'WooCommerce', 'E-commerce'],
                  liveUrl: 'https://mysweetemporium.com'
                },
                {
                  title: '1942: Truly Forgotten',
                  year: '2025',
                  status: 'Live',
                  description: 'A historical memorial website dedicated to preserving the untold stories and forgotten heroes of 1942. Built with a cinematic dark aesthetic, featuring immersive storytelling, archival imagery, and educational content honoring those lost to history.',
                  image: '/1942-forgotten.png',
                  tech: ['React', 'Vite', 'Tailwind CSS', 'JavaScript'],
                  liveUrl: 'https://trulyforgtten.shop'
                }
              ].map((project, index) => (
                <div
                  key={project.title}
                  className="group grid lg:grid-cols-12 gap-4 sm:gap-8 py-6 sm:py-8 border-b border-border/50 hover:border-border transition-colors duration-500"
                >
                  <div className="lg:col-span-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl sm:text-4xl font-light text-foreground">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{project.year}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs text-green-600 dark:text-green-400">{project.status}</span>
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-medium font-outfit">{project.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed max-w-lg font-roboto">{project.description}</p>
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
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      loading={index === 0 ? "eager" : "lazy"}
                      priority={index === 0}
                      quality={75}
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
          <div className="space-y-12 sm:space-y-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <h2 className="text-3xl sm:text-4xl font-light font-outfit">Skills & Expertise</h2>
            </div>

            {/* Scrolling Ticker */}
            <div className="relative overflow-hidden py-4">
              <div className="flex animate-scroll gap-8">
                {[...Array(2)].map((_, setIndex) => (
                  <div key={setIndex} className="flex gap-8">
                    {[
                      {
                  name: 'React', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
                    </svg>
                  )
                },
                {
                  name: 'Next.js', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M11.5725 0c-.1763 0-.3098.0013-.3584.0067-.0516.0053-.2159.021-.3636.0328-3.4088.3073-6.6017 2.1463-8.624 4.9728C1.1004 6.584.3802 8.3666.1082 10.255c-.0962.669-.1352.935-.1352 1.604 0 .669.0391.9351.1352 1.604.4566 3.1719 2.0291 5.9891 4.4474 7.9611 1.1613.9467 2.4839 1.6842 3.9127 2.1818 1.0215.3565 2.0811.5778 3.1899.6648.3636.0284.9816.0284 1.3452 0 1.3766-.1022 2.6656-.4217 3.8787-.9598l.0938-.0418-.2109-1.5029c-.0077-.0539-.0267-.0762-.0502-.0762-.0229 0-.1146.0438-.2039.0973-.2193.131-.5756.3197-.815.4319-1.5109.7089-3.1299 1.056-4.7869 1.0293-.3428-.0052-.6879-.0333-1.0372-.0835-.0768-.0113-.1542-.0226-.231-.0339-2.9349-.4383-5.4667-2.3101-6.8652-5.0713-.1867-.3679-.3523-.7514-.496-1.1496-.0443-.122-.0885-.2447-.1327-.3674-.4356-1.2195-.5856-2.5115-.4378-3.7866.0187-.1636.0408-.3271.0657-.4894.5547-3.6135 3.0312-6.7178 6.4576-8.1005.5398-.218 1.1034-.3929 1.6854-.5246 1.4655-.331 3.0006-.3525 4.4732-.0633l.3012.059.0406-.0556c.0289-.0398.1141-.1545.19-.2548.0761-.1009.2082-.2751.2935-.3875l.1551-.2042-.1287-.0652c-.6949-.3534-1.4305-.6288-2.1935-.8207C14.5053.1108 12.9878-.0262 11.5726 0h-.0001zm1.5406 6.8193c-1.0177.0073-2.0075.3066-2.8528.8612-.1177.0773-.2329.1551-.3448.2367l-.0861.0628.2539.3431c.1399.189.4027.5431.5841.7873l.3292.4435.1338-.0958c.3656-.2631.776-.4715 1.2072-.6133l.0361-.0118c1.0992-.3604 2.3091-.1789 3.254.4882.1495.1047.2858.222.4101.3509l.0354.0366.4049-.3972c.2231-.2185.4238-.4203.4469-.4485.0453-.0553.0398-.063-.2506-.3511-.3389-.3359-.7006-.6107-1.0948-.8312-.851-.4768-1.8054-.7106-2.7553-.6913h-.0003v-.0001zm.0006 2.3953c-.0828-.0018-.1656.0018-.2481.0108-.3619.0399-.7134.1504-1.0295.3238-.8149.447-1.3523 1.2201-1.4827 2.1321-.0452.3161-.0452.4884 0 .8046.2107 1.4705 1.4764 2.5369 2.9605 2.4944 1.1207-.0321 2.1275-.7122 2.5664-1.7334.0612-.1425.1159-.2964.1596-.4589l.0205-.0762-.324-.0006c-.5765-.0007-1.5702-.0164-1.9629-.0312l-.4269-.0159-.0228.0755c-.077.2544-.3294.5173-.5961.6202-.1013.0391-.167.0505-.3294.0576-.4043.0176-.7272-.1325-.9142-.4252-.0664-.1038-.0873-.1611-.1014-.2778-.0063-.0518-.0084-.1047-.0076-.1545.0017-.0984.0235-.203.0631-.3033.201-.5095.7507-.7999 1.2889-.6812.2271.0501.4093.1579.5513.3261.0471.0557.0918.122.1332.1963l.0353.0634.8588-.0007.8587-.0006-.0123-.0677c-.0207-.114-.0741-.3095-.1188-.4352-.2306-.6479-.7272-1.2122-1.3594-1.5455-.3851-.2031-.8228-.326-1.2683-.3562-.0718-.0049-.1437-.0064-.2152-.007l.0001.0001zm.0135 1.6013c-.3077.0139-.5941.1568-.7965.3972l-.031.0368-.1749-.1244-.1748-.1243.0289-.0294c.0493-.0502.1283-.1259.1758-.1683.209-.1861.4566-.3271.727-.4141.0557-.0179.097-.0284.1233-.0312l.0237-.0026-.0006.1823-.0007.1823-.3188.0143.4376-.0186-.0001-.0001z" />
                    </svg>
                  )
                },
                {
                  name: 'TypeScript', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z" />
                    </svg>
                  )
                },
                {
                  name: 'Node.js', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z M19.099,13.993 c0-1.9-1.284-2.406-3.987-2.763c-2.731-0.361-3.009-0.548-3.009-1.187c0-0.528,0.235-1.233,2.258-1.233 c1.807,0,2.473,0.389,2.747,1.607c0.024,0.115,0.129,0.199,0.247,0.199h1.141c0.071,0,0.138-0.031,0.186-0.081 c0.048-0.054,0.074-0.123,0.067-0.196c-0.177-2.098-1.571-3.076-4.388-3.076c-2.508,0-4.004,1.058-4.004,2.833 c0,1.925,1.488,2.457,3.895,2.695c2.88,0.282,3.103,0.703,3.103,1.269c0,0.983-0.789,1.402-2.642,1.402 c-2.327,0-2.839-0.584-3.011-1.742c-0.02-0.124-0.126-0.215-0.253-0.215h-1.137c-0.141,0-0.254,0.112-0.254,0.253 c0,1.482,0.806,3.248,4.655,3.248C17.501,17.007,19.099,15.91,19.099,13.993z" />
                    </svg>
                  )
                },
                {
                  name: 'Tailwind', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z" />
                    </svg>
                  )
                },
                {
                  name: 'PostgreSQL', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3418-2.2569.0405-2.4315-.0901.7624-1.5615 1.4304-3.4623 1.7865-5.3009.4377-2.2595.2999-4.0835-.3898-5.1451-.7541-1.1612-1.7552-1.8239-2.9722-1.9695-.481-.0578-1.0082-.0258-1.526.0923a4.4592 4.4592 0 0 0-.8994.2698c-.2314-.1628-.4775-.3037-.7479-.4203A6.1504 6.1504 0 0 0 13.0137 1c-2.333 0-3.9575 1.7918-4.5 2.8871-.4484-.1627-.9197-.2565-1.4024-.2775-.8573-.0374-1.6629.164-2.3862.595C3.4459 4.8876 2.7039 6.2645 2.3697 8.2497c-.1617.959-.1372 2.8637.055 4.7948.2003 2.0106.4586 3.7365.7552 4.8971-.0048.1106.0037.2258.0311.3381.0547.2241.1747.4289.347.5911.3879.365.8971.5552 1.4153.5469.3447-.0058.6882-.0617 1.015-.1661.0375-.012.0749-.0253.1119-.0389.2438-.0901.4786-.2114.6991-.362.1395-.0952.2719-.2024.3963-.321.0594-.0567.114-.1145.1654-.1717a.6815.6815 0 0 0 .0796-.0907c.0541-.0752.1028-.1544.1447-.2374a4.1123 4.1123 0 0 0 .1962-.468 7.5744 7.5744 0 0 0 .2375-.7759c.0594-.2301.1155-.4697.1669-.7167.0246-.1183.0472-.2379.0676-.3582.0114-.067.0216-.1343.0311-.2015.0086-.0559.0161-.1117.0229-.1675.0074-.0592.0134-.1185.0185-.1777l.0009-.0023c.0051-.0579.0086-.1154.0118-.1733.0309-.1174.0592-.2322.0844-.344l.0195-.0879c.3118-1.4052.3908-2.541.4067-3.2299a11.8554 11.8554 0 0 0 .4814 1.5797c.4197 1.1308.9787 2.1746 1.6527 3.0899-.0706.2786-.1298.5566-.178.8342-.2006 1.1564-.2018 2.3296-.0036 3.4938.203 1.195 1.0735 2.6674 2.1893 2.8569.1709.0291.3565.0436.5608.0404.6168-.0098 1.338-.1457 2.0256-.4388.1086-.0463.2196-.0998.3313-.1606.0353-.0192.0717-.0401.1091-.0624a5.9008 5.9008 0 0 0 .6015-.3974c.1084-.0811.2221-.1724.3396-.2731.5738-.493 1.2101-1.2103 1.6944-2.1272.3024-.5728.5432-1.1851.7128-1.8096.1176-.0372.2365-.0765.3551-.1185.8295-.2934 1.5174-.6473 2.0388-1.0495.5765-.4449.9663-.9449 1.1291-1.4444a1.1524 1.1524 0 0 0 .0441-.1596zM4.1053 17.1714v-.0023c-.2896-1.1224-.5426-2.7984-.7378-4.7562-.1924-1.9318-.2037-3.7139-.0541-4.5943.3164-1.8791.9728-3.0998 1.9569-3.6304.5608-.3026 1.2031-.4742 1.8899-.4512.4038.0136.8131.0867 1.2147.2175a6.7786 6.7786 0 0 1 .5308.2056l.0257.0115c-.0312.0407-.063.082-.0938.1239-.2174.3066-.4038.6295-.5588.9654a10.2898 10.2898 0 0 0-.6693 2.004 16.0705 16.0705 0 0 0-.3737 2.2162c-.0907.7489-.143 1.5127-.1548 2.262-.0002.0149-.0006.0298-.0008.0447v.0004c-.0005.0344-.001.0688-.0013.1032-.0009.1074-.0004.2141.0013.32h-.0023c.005.3287.0195.6465.0435.9536l-.0017.0009c.0244.3152.0604.621.1044.9172a2.5994 2.5994 0 0 1-.6695.3855c-.2372.0917-.4853.1555-.7371.1903-.2018.0277-.4046.0293-.6034.0043-.0853-.0108-.175-.0304-.2666-.0589-.1377-.6612-.2754-1.5159-.3933-2.4896zm8.1318 6.4298c-.0652.0097-.1377.0153-.2188.0164-.3478.0028-.8048-.1089-1.2007-.6153-.391-.5004-.8155-1.3917-.9621-2.2545-.1657-.9758-.1556-1.974.0312-2.9757a8.8372 8.8372 0 0 1 .1588-.6761c.4143.4025.8687.7596 1.3579 1.068.0329.0207.0659.0414.0991.0619-.0011.0562-.0027.1127-.0046.1696a13.5624 13.5624 0 0 0-.0137.8898c.0082.545.0431 1.0783.11 1.5911.0665.5099.1642.9846.2875 1.3979.0562.1886.1228.362.1977.5228.0183.0392.038.0782.0585.1166-.1098.0463-.2225.0869-.3365.1216-.1843.0562-.3696.0985-.5543.1259zm8.7063-6.6092c-.0655.2449-.2624.5524-.7226.9205-.4109.3288-.954.6169-1.5989.8561a13.3167 13.3167 0 0 1-.3659.1237 7.417 7.417 0 0 0 .1696-1.0482c.0558-.5015.0584-1.0176.0195-1.5295a12.2808 12.2808 0 0 0-.1645-1.3648c.2464.0644.4939.1055.7412.1217.7877.0514 1.5178-.1459 2.0954-.5361.1017.3161.1634.6439.1738.9757a4.3474 4.3474 0 0 1-.3476 1.4809zm-1.7842-2.9878c-.0813.0377-.1673.0732-.2564.1063-.1915.0711-.3987.1344-.6209.1904-.039-.0798-.0808-.1612-.1254-.244-.4109-.7621-.9944-1.5548-1.7359-2.368-.0179-.0196-.0348-.0387-.0528-.0582.0025-.0173.0062-.0352.009-.0523.0166-.1035.0328-.2078.0493-.3135l.0029-.018c.0122-.0793.026-.159.0412-.2395.0118-.0623.0236-.1243.0359-.1862.0227-.1146.0491-.231.0787-.3493.0222-.0892.0469-.1776.075-.2666.173-.5475.3995-1.0821.6722-1.5867.1374-.2541.2902-.4979.4546-.7283.1555-.2177.3203-.4189.4918-.5996a4.1476 4.1476 0 0 1 .6266-.5432c.1879-.1324.3889-.2403.5984-.3227.4222-.1659.8678-.2445 1.3183-.2155.8259.0531 1.5558.4407 2.1654 1.1465.5401.6253.8181 1.2866.8702 2.067.0532.7978-.0768 1.6797-.3796 2.6175-.15.4635-.3358.9193-.5506 1.3628a7.6462 7.6462 0 0 1-.5133.8781 7.9084 7.9084 0 0 1-.546.7104c-.5575-.3185-1.2061-.5106-1.9043-.5541a5.3488 5.3488 0 0 0-1.3131.086c-.3781.073-.739.1901-1.0743.3474z" />
                    </svg>
                  )
                },
                {
                  name: 'MongoDB', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0111.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 003.639-8.464c.01-.814-.103-1.662-.197-2.218zm-5.336 8.195s0-8.291.275-8.29c.213 0 .49 10.695.49 10.695-.381-.045-.765-1.76-.765-2.405z" />
                    </svg>
                  )
                },
                {
                  name: 'Git', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.6-.401-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187" />
                    </svg>
                  )
                },
                {
                  name: 'Docker', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z" />
                    </svg>
                  )
                },
                {
                  name: 'AWS', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.375 6.18 6.18 0 0 1-.248-.471c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.031-.863.103-.295.072-.583.16-.862.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586zm-3.24 1.214c.263 0 .534-.048.822-.144.287-.096.543-.271.758-.51.128-.152.224-.32.272-.512.047-.191.08-.423.08-.694v-.335a6.66 6.66 0 0 0-.735-.136 6.02 6.02 0 0 0-.75-.048c-.535 0-.926.104-1.19.32-.263.215-.39.518-.39.917 0 .375.095.655.295.846.191.2.47.296.838.296zm6.41.862c-.144 0-.24-.024-.304-.08-.064-.048-.12-.16-.168-.311L7.586 5.55a1.398 1.398 0 0 1-.072-.32c0-.128.064-.2.191-.2h.783c.151 0 .255.025.31.08.065.048.113.16.16.312l1.342 5.284 1.245-5.284c.04-.16.088-.264.151-.312a.549.549 0 0 1 .32-.08h.638c.152 0 .256.025.32.08.063.048.12.16.151.312l1.261 5.348 1.381-5.348c.048-.16.104-.264.16-.312a.52.52 0 0 1 .311-.08h.743c.127 0 .2.065.2.2 0 .04-.009.08-.017.128a1.137 1.137 0 0 1-.056.2l-1.923 6.17c-.048.16-.104.263-.168.311a.51.51 0 0 1-.303.08h-.687c-.151 0-.255-.024-.32-.08-.063-.056-.119-.16-.15-.32l-1.238-5.148-1.23 5.14c-.04.16-.087.264-.15.32-.065.056-.177.08-.32.08zm10.256.215c-.415 0-.83-.048-1.229-.143-.399-.096-.71-.2-.918-.32-.128-.071-.215-.151-.247-.223a.563.563 0 0 1-.048-.224v-.407c0-.167.064-.247.183-.247.048 0 .096.008.144.024.048.016.12.048.2.08.271.12.566.215.878.279.319.064.63.096.95.096.502 0 .894-.088 1.165-.264a.86.86 0 0 0 .415-.758.777.777 0 0 0-.215-.559c-.144-.151-.415-.287-.807-.415l-1.157-.36c-.583-.183-1.014-.454-1.277-.813a1.902 1.902 0 0 1-.4-1.158c0-.335.073-.63.216-.886.144-.255.335-.479.575-.654.24-.184.51-.32.83-.415.32-.096.655-.136 1.006-.136.175 0 .359.008.535.032.183.024.35.056.518.088.16.04.312.08.455.127.144.048.256.096.336.144a.69.69 0 0 1 .24.2.43.43 0 0 1 .071.263v.375c0 .168-.064.256-.184.256a.83.83 0 0 1-.303-.096 3.652 3.652 0 0 0-1.532-.311c-.455 0-.815.071-1.062.223-.248.152-.375.383-.375.71 0 .224.08.416.24.567.159.152.454.304.877.44l1.134.358c.574.184.99.44 1.237.767.247.327.367.702.367 1.117 0 .343-.072.655-.207.926-.144.272-.336.511-.583.703-.248.2-.543.343-.886.447-.36.111-.734.167-1.142.167zM21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351 3.384 1.963 7.559 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.383.607zM22.792 14.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z" />
                    </svg>
                  )
                },
                {
                  name: 'GraphQL', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M14.051 2.751l4.935 2.85c.816-.859 2.173-.893 3.032-.077.148.14.274.301.377.477.589 1.028.232 2.339-.796 2.928-.174.1-.361.175-.558.223v5.699c1.146.273 1.854 1.423 1.58 2.569-.048.204-.127.4-.232.581-.592 1.023-1.901 1.374-2.927.782-.196-.113-.375-.259-.526-.432l-4.935 2.85c.274 1.146-.423 2.294-1.57 2.568-1.146.273-2.294-.423-2.568-1.57-.096-.404-.096-.825 0-1.229l-4.934-2.85c-.832.867-2.205.893-3.072.06s-.893-2.205-.06-3.072c.155-.161.34-.3.545-.411V8.247c-1.145-.282-1.845-1.437-1.563-2.582.1-.406.318-.778.628-1.061.902-.822 2.296-.755 3.118.146.106.117.201.246.281.384l4.935-2.85C7.933 1.12 8.615-.062 9.78.025c.406.031.796.18 1.118.427.831.64 1.011 1.822.405 2.671-.092.129-.201.246-.323.349l.018-.006.053.035zm-.174 1.228l.148.103c.109.08.226.149.35.207l-2.063 5.66 5.648 1.166-.063.065c-.063.074-.122.15-.178.229L12.093 9.87l-.1 5.882c.124.027.245.065.362.111l.052.025 2.063-5.659 5.648 1.165-.009.064c-.005.072-.006.144-.003.216l-5.66 1.182-.098 5.879-.066-.027c-.083-.03-.168-.054-.254-.072l.098-5.881-5.648-1.166.054-.059c.073-.085.14-.175.198-.27l5.656 1.161.1-5.88-.063-.028c-.076-.038-.15-.08-.221-.127l-2.066 5.665-5.648-1.166.009-.068c.006-.068.008-.136.003-.204l5.66-1.181.099-5.883.066.027c.083.03.168.054.254.072L11.9 9.875l5.648 1.166-.051.055c-.058.065-.112.134-.16.205l-5.66-1.168-.099 5.884.066.026c.072.032.143.069.211.109l2.063-5.663 5.648 1.166-.015.08c-.012.072-.017.143-.017.213l-5.654 1.182-.1 5.879-.063-.025c-.074-.026-.15-.047-.227-.062l.1-5.885-5.648-1.166.047-.053c.057-.072.108-.148.152-.227l5.66 1.168.099-5.883-.066-.027c-.083-.03-.168-.054-.254-.072z" />
                    </svg>
                  )
                },
                {
                  name: 'Figma', icon: (
                    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                      <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.098-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z" />
                    </svg>
                  )
                },
              ].map((skill) => (
                    <div
                      key={`${setIndex}-${skill.name}`}
                      className="group flex items-center gap-3 px-6 py-3 hover:border-primary/50 hover:bg-accent/30 transition-all duration-300 whitespace-nowrap flex-shrink-0"
                    >
                      <div className="text-muted-foreground group-hover:text-primary transition-colors duration-300">
                        {skill.icon}
                      </div>
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        {skill.name}
                      </span>
                    </div>
                  ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
