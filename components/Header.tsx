"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { ThemeTransition } from "./ThemeTransition"

export function Header({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: "Projects", href: "#projects", homeOnly: true },
    { label: "Blog", href: "/blog", homeOnly: false },
    { label: "Contact", href: "#connect", homeOnly: true },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'py-3' : 'py-0'}`}
    >
      <div
        className={`transition-all duration-500 ${isScrolled
          ? 'max-w-3xl mx-auto px-4 backdrop-blur-xl bg-background/70 border border-border/50 rounded-full shadow-lg'
          : 'max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 bg-transparent border-b border-transparent'
          }`}
      >
        <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? 'h-12' : 'h-20'}`}>
          {/* Left - Logo only */}
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity duration-300"
          >
            <div className={`relative transition-all duration-300 rounded-full overflow-hidden ${isScrolled ? 'w-8 h-8' : 'w-10 h-10'}`}>
              <Image
                src="/favicon.ico"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          {/* Right - Nav + Theme Toggle grouped together */}
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                if (item.homeOnly && !isHome) return null

                const isScrollLink = item.href.startsWith("#")

                if (isScrollLink && isHome) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: "smooth" })}
                      className={`px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-full hover:bg-accent ${isScrolled ? 'text-xs' : 'text-sm'}`}
                    >
                      {item.label}
                    </button>
                  )
                }


                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-full hover:bg-accent ${isScrolled ? 'text-xs' : 'text-sm'}`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="h-5 w-px bg-neutral-300/40 dark:bg-neutral-700/50 mx-1" />

            {/* Theme Toggle right after nav */}
            <ThemeTransition isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </div>
    </header>
  )
}
