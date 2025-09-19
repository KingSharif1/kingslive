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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8"
      >
        <div className="flex justify-between items-center">
          {/* Left side - Logo and title */}
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Back to Home</span>
            </Link>
            <div className="border-l border-gray-300 dark:border-gray-600 pl-4 hidden sm:block">
              <h1 className="text-3xl font-bold light-mode-text dark:text-white">Control Room</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your blog posts, comments, and analytics</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-xl font-bold light-mode-text dark:text-white">Control Room</h1>
            </div>
          </div>

          {/* Right side - Desktop view */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-sm font-medium light-mode-text dark:text-white">
                {user?.username || user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
            <button
              onClick={onSignOut}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-md"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
              className="md:hidden mt-4 border-t border-gray-200 dark:border-gray-600 pt-4"
            >
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium light-mode-text dark:text-white">
                      {user?.username || user?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shadow-md"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
