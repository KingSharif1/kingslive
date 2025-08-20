"use client"

import { useState } from "react"
import { Plus, MessageSquare, BarChart } from "lucide-react"
import { motion } from "framer-motion"

interface NavigationProps {
  activeSection: 'posts' | 'comments' | 'analytics';
  pendingComments: number;
  isCreating: boolean;
  onSectionChange: (section: 'posts' | 'comments' | 'analytics') => void;
  onCreateNew: () => void;
}

export default function Navigation({ 
  activeSection, 
  pendingComments, 
  isCreating, 
  onSectionChange, 
  onCreateNew 
}: NavigationProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <>
      {/* Desktop Navigation */}
      <div className="bg-slate-200 dark:bg-slate-800 rounded-xl backdrop-blur-lg backdrop-contrast-150 backdrop-brightness-150 mb-8 px-2 py-2 w-fit hidden md:block">
        <div className="flex space-x-1">
          <button
            onClick={() => onSectionChange('posts')}
            className={`px-4 py-2 rounded-xl font-medium transition-all hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-foreground flex items-center gap-2 ${
              activeSection === 'posts' 
                ? 'bg-slate-300 dark:bg-slate-700 text-primary-foreground shadow-sm hover:bg-slate-300 dark:hover:bg-slate-700' 
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span>Posts</span>
          </button>
          <button
            onClick={() => onSectionChange('comments')}
            className={`px-4 py-2 rounded-xl font-medium transition-all hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-foreground flex items-center gap-2 ${
              activeSection === 'comments' 
                ? 'bg-slate-300 dark:bg-slate-700 text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span>Comments</span>
            {pendingComments > 0 && (
              <span className="ml-1 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingComments}
              </span>
            )}
          </button>
          <button
            onClick={() => onSectionChange('analytics')}
            className={`px-4 py-2 rounded-xl font-medium transition-all hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-foreground flex items-center gap-2 ${
              activeSection === 'analytics' 
                ? 'bg-slate-300 dark:bg-slate-700 text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <span>Analytics</span>
          </button>
          {activeSection === 'posts' && (
            <button
              onClick={onCreateNew}
              className={`px-4 py-2 rounded-xl font-medium transition-all hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-foreground flex items-center gap-2 ${
                isCreating 
                  ? 'bg-teal-700/80 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-teal-900/50'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>New Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden mb-6">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => onSectionChange('posts')}
            className={`p-3 rounded-xl font-medium transition-all flex flex-col items-center justify-center ${
              activeSection === 'posts' 
                ? 'bg-slate-300 dark:bg-slate-700 text-primary-foreground shadow-sm' 
                : 'bg-slate-200/80 dark:bg-slate-800/80 text-muted-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span className="text-xs mt-1">Posts</span>
          </button>
          <button
            onClick={() => onSectionChange('comments')}
            className={`p-3 rounded-xl font-medium transition-all flex flex-col items-center justify-center relative ${
              activeSection === 'comments' 
                ? 'bg-slate-300 dark:bg-slate-700 text-primary-foreground shadow-sm' 
                : 'bg-slate-200/80 dark:bg-slate-800/80 text-muted-foreground'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Comments</span>
            {pendingComments > 0 && (
              <span className="absolute top-1 right-1 bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {pendingComments}
              </span>
            )}
          </button>
          <button
            onClick={() => onSectionChange('analytics')}
            className={`p-3 rounded-xl font-medium transition-all flex flex-col items-center justify-center ${
              activeSection === 'analytics' 
                ? 'bg-slate-300 dark:bg-slate-700 text-primary-foreground shadow-sm' 
                : 'bg-slate-200/80 dark:bg-slate-800/80 text-muted-foreground'
            }`}
          >
            <BarChart className="h-5 w-5" />
            <span className="text-xs mt-1">Analytics</span>
          </button>
        </div>

        {activeSection === 'posts' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onCreateNew}
            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              isCreating 
                ? 'bg-teal-700/80 text-white shadow-sm' 
                : 'bg-teal-600/70 text-white hover:bg-teal-700/80'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>New Post</span>
          </motion.button>
        )}
      </div>
    </>
  )
}
