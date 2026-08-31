'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ThemeTransition } from './ThemeTransition'

export function BlogNav({
  isDark,
  toggleTheme,
}: {
  isDark: boolean
  toggleTheme: () => void
}) {
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between px-5 sm:px-8 py-5 bg-[var(--blog-paper)]/80 backdrop-blur-md">
      <Link href="/blog" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
        <span className="relative h-8 w-8 overflow-hidden">
          <Image src="/favicon.ico" alt="" fill sizes="32px" className="object-contain" />
        </span>
        <span className="text-[11px] font-mono tracking-[0.28em] uppercase text-[var(--blog-ink)]">
          King · Notes
        </span>
      </Link>
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--blog-muted)] hover:text-[var(--blog-ink)]"
        >
          Home
        </Link>
        <ThemeTransition isDark={isDark} onToggle={toggleTheme} />
      </div>
    </nav>
  )
}
