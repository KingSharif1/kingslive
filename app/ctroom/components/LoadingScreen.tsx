import React from 'react'
import { Loader2, Terminal, Database, Shield } from 'lucide-react'

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="relative p-8 rounded-2xl shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center space-y-6 max-w-md w-full mx-4">
        
        {/* Animated background elements */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-teal-500/10 animate-pulse"></div>
        
        {/* Main loading spinner */}
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-spin" />
            <div className="absolute inset-0 h-16 w-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-ping opacity-20"></div>
          </div>
        </div>

        {/* Title */}
        <div className="relative z-10 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Loading Control Room
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Initializing admin dashboard...
          </p>
        </div>

        {/* Loading steps */}
        <div className="relative z-10 w-full space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <Shield className="h-4 w-4 text-green-500 animate-pulse" />
            <span className="text-slate-700 dark:text-slate-300">Verifying credentials</span>
            <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full animate-pulse w-full"></div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <Database className="h-4 w-4 text-blue-500 animate-pulse" />
            <span className="text-slate-700 dark:text-slate-300">Connecting to database</span>
            <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <Terminal className="h-4 w-4 text-purple-500 animate-pulse" />
            <span className="text-slate-700 dark:text-slate-300">Loading interface</span>
            <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full animate-pulse w-1/2"></div>
            </div>
          </div>
        </div>

        {/* Floating dots animation */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-bounce opacity-60"></div>
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-purple-500 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 -left-3 w-2 h-2 bg-teal-500 rounded-full animate-bounce opacity-60" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  )
}

export default LoadingScreen
