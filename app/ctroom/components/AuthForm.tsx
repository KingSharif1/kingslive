"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Mail } from "lucide-react"
import { signInWithMagicLink } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

interface AuthFormProps {
  email: string
  setEmail: (email: string) => void
  authError: string
  magicLinkSent: boolean
  isLoading?: boolean
  onLogin: (email: string) => Promise<void>
}

function AuthForm({ email, setEmail, authError, magicLinkSent, isLoading = false, onLogin }: AuthFormProps) {
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!email) {
        return
      }

      await onLogin(email)
    } catch (error: any) {
      console.error('Login error:', error)
    }
  }

  return (
    <section className="py-20 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md rounded-1xl w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Control Room</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Admin access only.
            </p>
          </div>

          {magicLinkSent ? (
            <div className="text-center p-4 bg-green-300/70 dark:bg-green-900/40 rounded-xl mb-6">
              <p className="text-green-700 dark:text-green-400">
                Magic link sent! Check your email to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              {authError && (
                <div className="flex justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl w-fit flex items-center justify-center font-semibold text-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                  </motion.div>
                </div>

              )}

              <div className="w-full flex flex-col items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-fit flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send The Pigeon'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Clear all Supabase cookies
                    document.cookie.split(';').forEach(cookie => {
                      const name = cookie.split('=')[0].trim()
                      if (name.startsWith('sb-')) {
                        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
                      }
                    })
                    // Clear localStorage
                    Object.keys(localStorage).forEach(key => {
                      if (key.startsWith('sb-') || key.includes('supabase')) {
                        localStorage.removeItem(key)
                      }
                    })
                    window.location.reload()
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
                >
                  Having trouble? Clear session
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}

// Memoize to prevent unnecessary re-renders
export default memo(AuthForm)
