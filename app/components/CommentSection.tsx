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
      
      if (supabaseError) throw new Error(supabaseError.message)
      
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
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
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
