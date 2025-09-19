"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import GuestCommentForm from "./GuestCommentForm"
import { MessageSquare } from "lucide-react"

interface Comment {
  id: string
  post_id: string
  author_name: string
  content: string
  created_at: string
  approved: boolean
}

interface CommentSectionProps {
  postId: string
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error: supabaseError } = await supabase
        .from("blog_comments")
        .select("*")
        .eq("post_id", postId)
        .eq("approved", true)
        .order("created_at", { ascending: false })
      
      if (supabaseError) {
        // Transform database errors into user-friendly messages
        let errorMessage = supabaseError.message
        
        if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
          errorMessage = 'Unable to load comments at this time. Please try refreshing the page.'
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          errorMessage = 'Connection issue. Please check your internet and try again.'
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.'
        }
        
        throw new Error(errorMessage)
      }
      
      setComments(data || [])
    } catch (err) {
      console.error("Error fetching comments:", err)
      setError("Failed to load comments")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
    
    // Subscribe to new comments
    const subscription = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blog_comments",
          filter: `post_id=eq.${postId} AND approved=eq.true`,
        },
        (payload) => {
          setComments((prevComments) => [payload.new as Comment, ...prevComments])
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [postId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 light-mode-text dark:text-white flex items-center">
        <MessageSquare className="w-5 h-5 mr-2" />
        Comments
      </h2>
      
      <GuestCommentForm postId={postId} onCommentAdded={fetchComments} />
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-400 dark:text-red-300 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Unable to load comments</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">{error}</p>
              <button 
                onClick={fetchComments}
                className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      ) : comments.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 text-center"
        >
          <div className="flex flex-col items-center">
            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No comments yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Be the first to share your thoughts!</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium light-mode-text dark:text-white">
                      {comment.author_name}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm light-mode-text dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
