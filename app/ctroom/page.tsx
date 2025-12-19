"use client"

import { useState, useEffect } from "react"
import { useToast, ToastContainer } from './components/Toast'
import QueryProvider from './components/QueryProvider'
import ErrorBoundary from './components/ErrorBoundary'
import { DashboardLayout } from './components/dashboard/Layout'
import { Dashboard } from './components/dashboard/Dashboard'
import { TooltipProvider } from '@/components/ui/tooltip'
import AuthForm from './components/AuthForm'
import { AuthService } from './services/authService'

export default function CtroomPage() {
  const { toasts, addToast, removeToast } = useToast()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [authError, setAuthError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Handle authentication state
  useEffect(() => {
    // Set loading state
    setIsAuthLoading(true)

    // Function to update auth state
    const updateAuthState = (user: any) => {
      setUser(user)
      setIsAuthenticated(!!user)
      setIsAuthLoading(false)
    }

    // Initial auth check
    const checkInitialAuth = async () => {
      try {
        const { user } = await AuthService.getCurrentUser()
        updateAuthState(user)
      } catch (error) {
        console.error('Initial auth check error:', error)
        updateAuthState(null)
      }
    }

    checkInitialAuth()

    // Subscribe to real-time auth changes
    const subscription = AuthService.subscribeToAuthChanges(updateAuthState)

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Login handler
  const handleLogin = async (emailToLogin: string) => {
    // Reset state and show loading
    setIsAuthLoading(true)
    setAuthError('')

    try {
      // Use the AuthService to handle login
      const { success, error, magicLinkSent: linkSent } = await AuthService.handleLogin(emailToLogin)

      // Handle successful login
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

      // Handle login error
      if (error) {
        setAuthError(error)
        addToast({
          type: 'error',
          title: 'Login Failed',
          message: error
        })
      }
    } catch (error: any) {
      // Handle unexpected errors
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
