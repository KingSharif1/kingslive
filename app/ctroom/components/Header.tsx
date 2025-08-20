"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, AnimatePresence } from "framer-motion"

interface HeaderProps {
  user: {
    id: string;
    email: string;
    username?: string;
    isAdmin: boolean;
  } | null;
  onSignOut: () => void;
}

export default function Header({ user, onSignOut }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-4 md:p-6">
      <div className="flex justify-between items-center">
        {/* Left side - Logo and title */}
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Back to Home</span>
          </Link>
          <div className="border-l border-border pl-4 hidden sm:block">
            <h1 className="text-3xl font-bold text-foreground">Control Room</h1>
            <p className="text-muted-foreground mt-1">Manage your blog content</p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-xl font-bold text-foreground">Control Room</h1>
          </div>
        </div>

        {/* Right side - Desktop view */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {user?.username || user?.email?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
          <button
            onClick={onSignOut}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-accent/50 hover:bg-accent transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-4 border-t border-border pt-4"
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user?.username || user?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
                <button
                  onClick={onSignOut}
                  className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
