"use client"

import { useState, useEffect, lazy, Suspense, useMemo } from "react"
import { useRouter } from 'next/navigation'
import { signOut, getCurrentUser, signInWithMagicLink } from "@/lib/auth"
import { useToast, ToastContainer } from '../components/Toast'
import Header from "./Header"
import AuthForm from "./AuthForm"
import StatsCards from "./StatsCards"
import LoadingScreen from "./LoadingScreen"

// Lazy load heavy components
const AnalyticsDashboard = lazy(() => import("./AnalyticsDashboard"))

// Import React Query hooks
import {
  useAllPosts,
  useStats,
} from "../hooks/useQueries"

// Auth service wrapper
const AuthService = {
  getCurrentUser,
  signInWithMagicLink,
  signOut
}

export default function CtroomContent() {
  const { toasts, addToast, removeToast } = useToast()
  const router = useRouter()

  // Auth state
  const [authLoading, setAuthLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ id: string, email: string, username?: string, isAdmin: boolean } | null>(null)
  const [email, setEmail] = useState('')
  const [authError, setAuthError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  // UI state
  const [activeSection, setActiveSection] = useState<'analytics' | 'dreamboard'>('analytics')

  // React Query hooks
  const { data: allPosts } = useAllPosts()
  const { data: stats, isLoading: statsLoading } = useStats()

  // Analytics data - all from Sanity
  const analyticsData = {
    totalViews: stats?.totalViews || 0,
    viewsToday: stats?.totalViews || 0, // Using totalViews as placeholder until time-based analytics are implemented
    viewsThisWeek: stats?.totalViews || 0, // Using totalViews as placeholder
    viewsThisMonth: stats?.totalViews || 0, // Using totalViews as placeholder
    topPosts: allPosts?.slice(0, 5).map(post => ({
      title: post.title,
      views: post.views || 0,
      slug: post.slug
    })) || [],
    viewsOverTime: [],
    viewsByDay: [],
    engagement: 0.64
  }

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true)
      try {
        const currentUser = await AuthService.getCurrentUser()

        if (currentUser) {
          setUser(currentUser)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth error:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login handler
  const handleLogin = async (emailToLogin: string) => {
    setIsAuthLoading(true)
    setAuthError('')

    try {
      if (!emailToLogin || !emailToLogin.includes('@')) {
        const errorMsg = 'Please enter a valid email address'
        setAuthError(errorMsg)
        addToast({ type: 'error', title: 'Invalid Email', message: errorMsg })
        return
      }

      // Check if user is authorized admin
      const adminResponse = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToLogin.trim() }),
      })

      const adminResult = await adminResponse.json()

      if (!adminResponse.ok) {
        const errorMsg = adminResult.error || 'Error checking admin status'
        setAuthError(errorMsg)
        addToast({ type: 'error', title: 'Database Error', message: errorMsg })
        return
      }

      if (!adminResult.isAdmin) {
        const errorMsg = 'Access denied. Only admin users can login.'
        setAuthError(errorMsg)
        addToast({ type: 'error', title: 'Access Denied', message: errorMsg })
        return
      }

      await AuthService.signInWithMagicLink(emailToLogin)

      setEmail(emailToLogin)
      setMagicLinkSent(true)
      addToast({ type: 'success', title: 'Magic Link Sent', message: 'Check your email to complete sign in' })
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMsg = error.message || 'An error occurred during login'
      setAuthError(errorMsg)
      addToast({ type: 'error', title: 'Login Failed', message: errorMsg })
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await AuthService.signOut()
      window.location.href = '/ctroom'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // If auth is loading, show loading screen
  if (authLoading) {
    return <LoadingScreen />
  }

  // If not authenticated, show auth form
  if (!isAuthenticated) {
    return (
      <AuthForm
        email={email}
        setEmail={setEmail}
        authError={authError}
        magicLinkSent={magicLinkSent}
        isLoading={isAuthLoading}
        onLogin={handleLogin}
      />
    )
  }

  // Memoize time display to prevent unnecessary re-renders
  const currentTime = useMemo(() => new Date().toLocaleTimeString(), [])

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Simplified background gradient - removed extra wrapper */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-500/10 via-slate-600/10 to-slate-700/10 pointer-events-none" />

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex flex-col min-h-screen relative z-10">
        <Header user={user} onSignOut={handleSignOut} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Terminal-style welcome banner - removed backdrop-blur */}
          <div className="mb-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]/80 font-mono text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span>▸</span>
              <span>root@control-room:~$</span>
              <span className="text-[var(--foreground)]">Welcome back, {user?.email?.split('@')[0] || 'admin'}</span>
            </div>
          </div>

          <StatsCards stats={stats || { totalPosts: 0, publishedPosts: 0, totalViews: 0, featuredPosts: 0, avgRetention: 0 }} />

          {/* Section Navigation with subtle border */}
          <div className="relative mb-6 p-[1px] rounded-xl bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700">
            <div className="flex flex-wrap gap-2 sm:gap-4 bg-[var(--background)] rounded-xl p-2">
              <button
                onClick={() => setActiveSection('analytics')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-mono font-medium transition-all duration-300 ${activeSection === 'analytics'
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
              >
                <span className="hidden sm:inline">📊 </span>Analytics
              </button>
              <button
                onClick={() => setActiveSection('dreamboard')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-mono font-medium transition-all duration-300 ${activeSection === 'dreamboard'
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'bg-[var(--secondary)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
              >
                <span className="hidden sm:inline">✨ </span>Dreamboard
              </button>
              <a
                href="/studio"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-mono font-medium bg-slate-700 hover:bg-slate-600 text-white transition-all duration-300 text-center"
              >
                <span className="hidden sm:inline">✏️ </span>Edit Blog →
              </a>
            </div>
          </div>

          {/* Content area - simplified border */}
          <div className="rounded-xl border border-[var(--border)]">
            <div className="bg-[var(--background)] rounded-xl p-4 sm:p-6 min-h-[500px]">
              {statsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-[var(--muted)] rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-[var(--muted)] rounded w-full mb-2"></div>
                  <div className="h-4 bg-[var(--muted)] rounded w-5/6"></div>
                </div>
              ) : (
                <>
                  {activeSection === 'analytics' && (
                    <Suspense fallback={<LoadingScreen />}>
                      <AnalyticsDashboard data={analyticsData} />
                    </Suspense>
                  )}

                  {activeSection === 'dreamboard' && (
                    <div className="text-center py-20">
                      <div className="inline-block p-4 rounded-full bg-slate-700 mb-6">
                        <span className="text-4xl">✨</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-4 text-[var(--foreground)]">
                        Dreamboard Coming Soon
                      </h2>
                      <p className="text-[var(--muted-foreground)] max-w-md mx-auto font-mono text-sm">
                        <span className="text-slate-500">▸</span> Spatial timeline for organizing your dreams and goals
                        <br />
                        <span className="text-slate-500">▸</span> Drag and drop vision board
                        <br />
                        <span className="text-slate-500">▸</span> Connect related dreams with visual links
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Terminal-style footer - removed backdrop-blur and memoized time */}
          <div className="mt-6 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]/50 font-mono text-xs text-[var(--muted-foreground)]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span>System Status: <span className="text-green-500">ONLINE</span></span>
              <span>Session: {currentTime}</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
