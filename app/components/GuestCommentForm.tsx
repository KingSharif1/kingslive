"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"

interface GuestCommentFormProps {
  postId: string
  onCommentAdded?: () => void
}

export default function GuestCommentForm({ postId, onCommentAdded }: GuestCommentFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate inputs
      if (!name.trim() || !content.trim()) {
        throw new Error("Name and comment are required")
      }

      // Email validation (now required)
      if (!email.trim()) {
        throw new Error("Email address is required")
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address")
      }

      // Submit to Supabase
      const { error: supabaseError } = await supabase
        .from("blog_comments")
        .insert([
          {
            post_id: postId,
            author_name: name.trim(),
            author_email: email.trim(),
            content: content.trim(),
            approved: false // Comments require approval by default
          },
        ])

      if (supabaseError) {
        // Transform database errors into user-friendly messages
        let errorMessage = supabaseError.message
        
        if (errorMessage.includes('author_email') && errorMessage.includes('not-null')) {
          errorMessage = 'Email address is required and cannot be empty.'
        } else if (errorMessage.includes('violates not-null constraint')) {
          errorMessage = 'Please fill in all required fields.'
        } else if (errorMessage.includes('duplicate key')) {
          errorMessage = 'You have already submitted a comment. Please wait before submitting another.'
        } else if (errorMessage.includes('foreign key')) {
          errorMessage = 'Unable to submit comment. Please try refreshing the page.'
        } else if (errorMessage.includes('check constraint')) {
          errorMessage = 'Comment content contains invalid characters. Please review your message.'
        } else if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
          errorMessage = 'Unable to submit comment at this time. Please try again later.'
        }
        
        throw new Error(errorMessage)
      }

      // Clear form and show success message
      setName("")
      setEmail("")
      setContent("")
      setSuccess(true)
      
      // Notify parent component if callback provided
      if (onCommentAdded) onCommentAdded()
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-8"
    >
      <h3 className="text-xl font-semibold mb-4 light-mode-text dark:text-white">Leave a Comment</h3>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400 dark:text-red-300 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error submitting comment</h4>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </motion.div>
      )}
      
      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-400 dark:text-green-300 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Comment submitted successfully!</h4>
              <p className="text-sm text-green-700 dark:text-green-300">Your comment has been submitted and will be visible after approval.</p>
            </div>
          </div>
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Comment *
          </label>
          <textarea
            id="comment"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          ></textarea>
        </div>
        
        <div className="flex items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Comment"}
          </button>
          <p className="ml-3 text-xs text-gray-500 dark:text-gray-400">
            * Comments will be visible after approval
          </p>
        </div>
      </form>
    </motion.div>
  )
}
