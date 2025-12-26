"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useToast, ToastContainer } from './components/Toast'
import QueryProvider from './components/QueryProvider'
import ErrorBoundary from './components/ErrorBoundary'
import { DashboardLayout } from './components/dashboard/Layout'
import { Dashboard } from './components/dashboard/Dashboard'
import { Chat } from './components/dashboard/Chat'
import { TooltipProvider } from '@/components/ui/tooltip'
import AuthForm from './components/AuthForm'
import { AuthService } from './services/authService'

function CtroomContent() {
  const searchParams = useSearchParams()
  const section = searchParams.get('section')
  const { toasts, addToast, removeToast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [authError, setAuthError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Handle authentication state
  useEffect(() => {
    setIsAuthLoading(true)

    const updateAuthState = (user: any) => {
      setUser(user)
      setIsAuthenticated(!!user)
      setIsAuthLoading(false)
    }

    const checkInitialAuth = async () => {
      try {
        const { user } = await AuthService.getCurrentUser()
        updateAuthState(user)
      } catch (error) {
        console.error('Initial auth check error:', error)
        // Clear potentially corrupted cookies on error
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.split('=')[0].trim()
          if (name.startsWith('sb-')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
          }
        })
        updateAuthState(null)
      }
    }

    checkInitialAuth()

    const subscription = AuthService.subscribeToAuthChanges(updateAuthState)

    // Refresh session every 10 minutes
    const refreshInterval = setInterval(async () => {
      try {
        const { user } = await AuthService.getCurrentUser()
        if (!user) {
          updateAuthState(null)
        }
      } catch (error) {
        console.error('Session refresh error:', error)
      }
    }, 10 * 60 * 1000)

    return () => {
      subscription?.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, [])

  // Login handler
  const handleLogin = async (emailToLogin: string) => {
    setIsAuthLoading(true)
    setAuthError('')

    try {
      const { success, error, magicLinkSent: linkSent } = await AuthService.handleLogin(emailToLogin)

      if (success) {
        setEmail(emailToLogin)
        setMagicLinkSent(linkSent)
        addToast({
          type: 'success',
          title: 'Magic Link Sent',
          message: 'Check your email to complete sign in'
        })
        return
      }

      if (error) {
        setAuthError(error)
        addToast({
          type: 'error',
          title: 'Login Failed',
          message: error
        })
      }
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred during login'
      console.error('Login error:', errorMsg)
      setAuthError(errorMsg)
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: errorMsg
      })
    } finally {
      setIsAuthLoading(false)
    }
  }

  // Show loading state
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Show login form if not authenticated
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

  // Show dashboard if authenticated
  // Chat section renders full-screen without dashboard layout
  if (section === 'chat') {
    return (
      <ErrorBoundary>
        <TooltipProvider>
          <QueryProvider>
            <Chat />
            <ToastContainer toasts={toasts} removeToast={removeToast} />
          </QueryProvider>
        </TooltipProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <QueryProvider>
          <DashboardLayout>
            <Dashboard addToast={addToast} />
          </DashboardLayout>
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </QueryProvider>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default function CtroomPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <CtroomContent />
    </Suspense>
  )
}
