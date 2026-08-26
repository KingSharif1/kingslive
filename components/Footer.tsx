"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Footer() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const currentYear = new Date().getFullYear()

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ]

  const socialLinks = [
    {
      name: "GitHub",
      href: "https://github.com/KingSharif1",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/in/king-sharif/",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ]

  return (
    <footer className="relative mt-16 sm:mt-24 border-t border-border/50">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-0 py-12 sm:py-14">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-[1.2fr_1fr_auto]">
          <div className="space-y-3 text-center md:text-left">
            <Link
              href="/"
              className="inline-block text-xl font-semibold tracking-tight font-unbounded hover:opacity-80 transition-opacity"
            >
              King Sharif
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto md:mx-0">
              Full-stack developer crafting modern web products from Texas — portfolio, CTROOM, and everything in between.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-3"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
            {isHome && (
              <button
                type="button"
                onClick={() => document.getElementById("connect")?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </button>
            )}
            <Link
              href="/ctroom"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono tracking-wide"
            >
              CTROOM
            </Link>
          </nav>

          <div className="flex items-center justify-center md:justify-end gap-2">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all duration-300"
                aria-label={link.name}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {currentYear} King Sharif · Next.js & Tailwind
          </p>
          <p className="text-xs text-muted-foreground/70 font-mono tracking-wider uppercase">
            Designed in Texas
          </p>
        </div>
      </div>
    </footer>
  )
}
