"use client"

import React, { useState } from "react"
import { Check, Trash2, Archive, MessageCircle, CheckCircle, MessageSquare, Clock } from 'lucide-react'
import { Comment } from "../types"
import { DataService } from "../services/dataService"

interface CommentsSectionProps {
  comments: Comment[]
  onCommentsUpdate: (action: string, comment?: Comment) => void
  addToast?: (toast: { type: 'success' | 'error' | 'info', title: string, message?: string }) => void
}

export default function CommentsSection({ comments, onCommentsUpdate, addToast }: CommentsSectionProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [localComments, setLocalComments] = useState<Comment[]>(comments)

  // Update local comments when props change
  React.useEffect(() => {
    setLocalComments(comments)
  }, [comments])

  const handleApprove = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    
    // Show info toast before operation
    addToast?.({
      type: 'info',
      title: 'Approving Comment',
      message: 'Processing your request...'
    })
    
    setLoading(commentId)
    
    // Optimistic update
    setLocalComments(prev => 
      prev.map(c => c.id === commentId ? { ...c, approved: true } : c)
    )
    
    try {
      await DataService.approveComment(commentId)
      onCommentsUpdate('approve', comment)
      
      // Show success toast after operation completes
      addToast?.({
        type: 'success',
        title: 'Comment Approved',
        message: 'The comment has been approved successfully'
      })
    } catch (error) {
      console.error('Error approving comment:', error)
      // Revert optimistic update
      setLocalComments(comments)
      addToast?.({
        type: 'error',
        title: 'Failed to Approve Comment',
        message: 'An error occurred while approving the comment'
      })
    } finally {
      setLoading(null)
    }
  }

  const handleArchive = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    
    // Show info toast before operation
    addToast?.({
      type: 'info',
      title: 'Archiving Comment',
      message: 'Processing your request...'
    })
    
    setLoading(commentId)
    
    // Optimistic update
    setLocalComments(prev => 
      prev.filter(c => c.id !== commentId)
    )
    
    try {
      await DataService.archiveComment(commentId)
      onCommentsUpdate('archive', comment)
      
      // Show success toast after operation completes
      addToast?.({
        type: 'success',
        title: 'Comment Archived',
        message: 'The comment has been archived successfully'
      })
    } catch (error) {
      console.error('Error archiving comment:', error)
      // Revert optimistic update
      setLocalComments(comments)
      addToast?.({
        type: 'error',
        title: 'Failed to Archive Comment',
        message: 'An error occurred while archiving the comment'
      })
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment? This action cannot be undone.")) return
    
    const comment = comments.find(c => c.id === commentId)
    
    // Show info toast before operation
    addToast?.({
      type: 'info',
      title: 'Deleting Comment',
      message: 'Processing your request...'
    })
    
    setLoading(commentId)
    
    // Optimistic update
    setLocalComments(prev => prev.filter(c => c.id !== commentId))
    
    try {
      await DataService.deleteComment(commentId)
      onCommentsUpdate('delete', comment)
      
      // Show success toast after operation completes
      addToast?.({
        type: 'success',
        title: 'Comment Deleted',
        message: 'The comment has been deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      // Revert optimistic update
      setLocalComments(comments)
      addToast?.({
        type: 'error',
        title: 'Failed to Delete Comment',
        message: 'An error occurred while deleting the comment'
      })
    } finally {
      setLoading(null)
    }
  }

  if (localComments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No comments yet</h3>
        <p className="text-muted-foreground">Comments from your blog posts will appear here.</p>
      </div>
    )
  }

  const pendingComments = localComments.filter(comment => !comment.approved)
  const approvedComments = localComments.filter(comment => comment.approved)

  return (
    <div className="space-y-6 ">
      {/* Pending Comments */}
      {pendingComments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-foreground ">
              Pending Approval ({pendingComments.length})
            </h3>
          </div>
          <div className="space-y-4">
            {pendingComments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onApprove={handleApprove}
                onArchive={handleArchive}
                onDelete={handleDelete}
                loading={loading === comment.id}
                isPending={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved Comments */}
      {approvedComments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Check className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold text-foreground">
              Approved Comments ({approvedComments.length})
            </h3>
          </div>
          <div className="space-y-4">
            {approvedComments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onApprove={handleApprove}
                onArchive={handleArchive}
                onDelete={handleDelete}
                loading={loading === comment.id}
                isPending={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface CommentCardProps {
  comment: Comment
  onApprove: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  loading: boolean
  isPending: boolean
}

function CommentCard({ comment, onApprove, onArchive, onDelete, loading, isPending }: CommentCardProps) {
  return (
    <div className={`bg-card rounded-xl border p-4 ${isPending ? 'backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 border-orange-700/50  bg-stone-500/30 ring-2 ring-orange-500/60 dark:border-orange-800 dark:bg-stone-600/40 dark:ring-orange-600/70' : 'backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 bg-green-700/30 dark:bg-green-100/30 ring-2 ring-green-500/60 dark:ring-green-600/70 dark:border-green-600/70'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-foreground">{comment.author}</h4>
          <p className="text-sm text-muted-foreground">{comment.email}</p>
          {comment.blog_posts && (
            <p className="text-xs text-muted-foreground mt-1">
              On: {comment.blog_posts.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
          {isPending && (
            <span className="backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 ring-2 ring-orange-500/60 dark:border-orange-800 dark:bg-stone-600/40 dark:ring-orange-600/70 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs px-2 py-1 rounded-full">
              Pending
            </span>
          )}
        </div>
      </div>
      
      <p className="text-foreground mb-4 leading-relaxed">{comment.content}</p>
      
      <div className="flex justify-end gap-2">
        {isPending && (
          <button
            onClick={() => onApprove(comment.id)}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Check className="h-3 w-3" />
            {loading ? 'Approving...' : 'Approve'}
          </button>
        )}
        <button
          onClick={() => onArchive(comment.id)}
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
          title="Archive"
        >
          <Archive className="h-3 w-3" />
          {loading ? '...' : ''}
        </button>
        <button
          onClick={() => onDelete(comment.id)}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
          {loading ? '...' : ''}
        </button>
      </div>
    </div>
  )
}
