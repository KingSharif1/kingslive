"use client"

import { memo } from "react"
import Link from "next/link"
import { Home, Terminal, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  user: {
    id: string;
    email: string;
    username?: string;
    isAdmin: boolean;
  } | null;
  onSignOut: () => void;
}

function Header({ user, onSignOut }: HeaderProps) {
  return (
    <div className="relative p-[1px] mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 lg:mt-8 rounded-xl bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700">
      <div className="bg-[var(--background)] rounded-xl p-4 sm:p-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          {/* Left side - Logo and title */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)] transition-colors group"
            >
              <Home className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]" />
              <span className="text-sm font-mono hidden sm:inline text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">home</span>
            </Link>
            <div className="border-l border-[var(--border)] pl-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-slate-500" />
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-[var(--foreground)]">
                  control_room
                </h1>
              </div>
              <p className="text-xs font-mono text-[var(--muted-foreground)] mt-1 hidden sm:block">
                <span className="text-slate-500">▸</span> analytics • dreamboard • content
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-mono text-[var(--foreground)]">
                {user?.username || user?.email?.split('@')[0] || 'admin'}
              </p>
              <p className="text-xs font-mono text-[var(--muted-foreground)]">
                <span className="text-slate-500">●</span> root
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-mono bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export default memo(Header)
