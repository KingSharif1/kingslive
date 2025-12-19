"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Send, User, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { moderateContent, shouldAutoApproveByTime, sanitizeContent } from "@/lib/content-moderation"

interface Comment {
  id: string
  post_id: string
  author_name: string
  author_email: string
  content: string
  approved: boolean
  created_at: string
  archived: boolean
}

interface CommentsProps {
  postId: string
  autoApproveHours?: number // Hours before auto-approval (default 24)
}

export default function Comments({ postId, autoApproveHours = 24 }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')

  // Fetch comments
  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('id, post_id, author_name, content, approved, created_at')
        .eq('post_id', postId)
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching comments:', error)
        setComments([])
        return
      }

      // Filter: show approved comments OR auto-approve after threshold
      const visibleComments = (data || []).filter(comment => {
        if (comment.approved) return true
        return shouldAutoApproveByTime(comment.created_at, autoApproveHours)
      }) as Comment[]

      setComments(visibleComments)
    } catch (err) {
      console.error('Error fetching comments:', err)
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    // Validate
    if (!name.trim() || !email.trim() || !content.trim()) {
      setErrorMessage('Please fill in all fields')
      setIsSubmitting(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address')
      setIsSubmitting(false)
      return
    }

    // Content moderation (now async with OpenAI)
    const moderation = await moderateContent(content)
    
    if (moderation.hasProfanity) {
      setErrorMessage('Your comment contains inappropriate language. Please revise and try again.')
      setIsSubmitting(false)
      return
    }

    // Check OpenAI moderation results
    if (moderation.openAIFlagged) {
      const categories = moderation.openAICategories?.join(', ') || 'policy violation'
      setErrorMessage(`Your comment was flagged for: ${categories}. Please revise and try again.`)
      setIsSubmitting(false)
      return
    }

    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          author_name: sanitizeContent(name.trim()),
          author_email: email.trim().toLowerCase(),
          content: sanitizeContent(content.trim()),
          approved: moderation.shouldAutoApprove, // Auto-approve clean comments
          archived: false
        })

      if (error) throw error

      setSubmitStatus('success')
      setName('')
      setEmail('')
      setContent('')
      setShowForm(false)
      
      // Refresh comments if auto-approved
      if (moderation.shouldAutoApprove) {
        fetchComments()
      }
    } catch (err) {
      console.error('Error submitting comment:', err)
      setSubmitStatus('error')
      setErrorMessage('Failed to submit comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <section className="mt-16 pt-12 border-t border-[var(--border)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-[var(--foreground)]" />
          <h2 className="text-2xl font-fraunces font-semibold text-[var(--foreground)]">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h2>
        </div>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-full bg-[var(--foreground)] text-[var(--background)] font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Leave a comment
          </button>
        )}
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {submitStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Comment submitted!</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Your comment will appear shortly after review.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mb-8 p-6 rounded-2xl bg-[var(--secondary)] border border-[var(--border)]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Email * <span className="text-xs opacity-60">(not published)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  maxLength={100}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                Comment *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none font-open-sans"
                maxLength={2000}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Be respectful and constructive
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {content.length}/2000
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setErrorMessage('')
                }}
                className="px-4 py-2 rounded-full text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-[var(--foreground)] text-[var(--background)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse p-6 rounded-2xl bg-[var(--secondary)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--muted)]" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[var(--muted)] rounded" />
                  <div className="h-3 w-16 bg-[var(--muted)] rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-[var(--muted)] rounded" />
                <div className="h-4 w-3/4 bg-[var(--muted)] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--muted-foreground)] mb-2">No comments yet</p>
          <p className="text-sm text-[var(--muted-foreground)] opacity-70">
            Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-[var(--secondary)] border border-[var(--border)]"
            >
              {/* Comment Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--foreground)]/20 to-[var(--foreground)]/5 flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--foreground)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">{comment.author_name}</p>
                  <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <Clock className="w-3 h-3" />
                    {formatDate(comment.created_at)}
                  </div>
                </div>
              </div>
              
              {/* Comment Content */}
              <p className="text-[var(--foreground)] font-open-sans leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
