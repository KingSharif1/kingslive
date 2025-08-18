"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { signInWithMagicLink } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function AdminSetupPage() {
  const [email, setEmail] = useState("")
  const [setupKey, setSetupKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const router = useRouter()

  // Get the setup secret key from environment variables
  const SETUP_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SETUP_SECRET_KEY || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate inputs
      if (!email.trim()) {
        throw new Error("Email is required")
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address")
      }

      // Verify setup key
      if (setupKey !== SETUP_SECRET_KEY) {
        throw new Error("Invalid setup key")
      }

      // First, create the user account if it doesn't exist
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID(), // Generate a random password since we'll use magic links
      })

      if (signUpError) throw new Error(signUpError.message)

      // Get the user ID
      const userId = authData.user?.id
      if (!userId) throw new Error("Failed to create user account")

      // Add the user to the admin_users table
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert([{ id: userId, email }])

      if (insertError) throw new Error(insertError.message)

      // Send a magic link to the user's email
      await signInWithMagicLink(email)

      // Show success message
      setSuccess(true)
      setMagicLinkSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin account")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-20 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2 light-mode-text dark:text-white">Admin Account Setup</h1>
            <p className="text-gray-500 dark:text-gray-400">One-time setup for your admin account</p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
            </motion.div>
          )}
          
          {magicLinkSent && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p>Magic link sent! Check your email to complete setup.</p>
              </div>
            </motion.div>
          )}
          
          {!magicLinkSent && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  A magic link will be sent to this email
                </p>
              </div>
              
              <div>
                <label htmlFor="setupKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Setup Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="setupKey"
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter setup key"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Secret key to authorize admin setup
                </p>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Setting Up..." : "Set Up Admin Account"}
                </button>
              </div>
            </form>
          )}
          
          {magicLinkSent && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Check your email inbox for the magic link to complete the setup.
              </p>
              <button
                onClick={() => router.push("/ctroom")}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Go to Control Room
              </button>
            </div>
          )}
          
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            This page should only be used once to set up your admin account.
          </div>
        </motion.div>
      </div>
    </section>
  )
}
