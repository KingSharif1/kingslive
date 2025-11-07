"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Footer() {
  const pathname = usePathname()
  const isHome = pathname === "/"

  return (
    <footer className="border-t border-border/40 backdrop-blur-md backdrop-saturate-150 py-8">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Navigation</h3>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/blog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Blog
              </Link>
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Connect</h3>
            <nav className="flex flex-col gap-2">
              <a
                href="https://github.com/KingSharif1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/king-sharif/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                LinkedIn
              </a>
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">About</h3>
            <p className="text-sm text-muted-foreground">
              Full-stack developer based in Texas, specializing in modern web technologies and user-centric design.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} King Sharif. All rights reserved.
          </div>
          {!isHome && (
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Portfolio
            </Link>
          )}
        </div>
      </div>
    </footer>
  )
}
