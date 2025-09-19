"use client"

import React, { useState, useEffect } from "react"
import { Comment } from '../types'
import { DataService } from '../services/dataService'
import { Check, MessageSquare, Archive, Clock, CheckCircle, ArchiveRestore, Trash2 } from 'lucide-react'
import { useDeleteComment } from '../hooks/useQueries'
import { supabase } from "@/lib/supabase"

interface CommentsSectionProps {
  comments: Comment[]
  archivedComments: Comment[]
  onCommentsUpdate: (action: string, comment?: Comment) => void
  addToast?: (toast: { type: 'success' | 'error' | 'info', title: string, message?: string }) => void
  deleteCommentMutation?: (id: string) => Promise<void>
}

export default function CommentsSection({ comments, archivedComments, onCommentsUpdate, addToast, deleteCommentMutation: externalDeleteMutation }: CommentsSectionProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [localComments, setLocalComments] = useState<Comment[]>(comments)
  const [localArchivedComments, setLocalArchivedComments] = useState<Comment[]>(archivedComments)
  const [showArchived, setShowArchived] = useState(false)
  
  // Use React Query mutation hook for delete
  const { mutateAsync: deleteCommentMutation } = useDeleteComment()

  // Update local comments when props change
  React.useEffect(() => {
    setLocalComments(comments)
  }, [comments])

  React.useEffect(() => {
    setLocalArchivedComments(archivedComments)
  }, [archivedComments])

  const handleApprove = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    
    // Check if comment exists in archived comments - don't allow approving archived comments
    const isArchived = archivedComments.some(c => c.id === commentId)
    if (isArchived) {
      addToast?.({
        type: 'error',
        title: 'Cannot Approve Archived Comment',
        message: 'Archived comments cannot be approved. Please unarchive the comment first.'
      })
      return
    }
    
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
    
    if (!comment) return
    
    addToast?.({
      type: 'info',
      title: 'Archiving Comment',
      message: 'Processing your request...'
    })
    
    setLoading(commentId)
    
    // Optimistic update - remove from active comments
    setLocalComments(prev => prev.filter(c => c.id !== commentId))
    
    // Add to archived comments with archived flag set to true
    const archived = { ...comment, archived: true }
    setLocalArchivedComments(prev => [archived, ...prev])
    
    // Auto-show archived section if it wasn't visible
    if (!showArchived) {
      setShowArchived(true)
    }
    
    try {
      await DataService.archiveComment(commentId)
      onCommentsUpdate('archive', comment)
      
      addToast?.({
        type: 'success',
        title: 'Comment Archived',
        message: 'The comment has been archived successfully'
      })
    } catch (error) {
      console.error('Error archiving comment:', error)
      // Revert both optimistic updates
      setLocalComments(comments)
      setLocalArchivedComments(archivedComments)
      
      addToast?.({
        type: 'error',
        title: 'Failed to Archive Comment',
        message: 'An error occurred while archiving the comment'
      })
    } finally {
      setLoading(null)
    }
  }

  const handleUnarchive = async (commentId: string) => {
    const comment = localArchivedComments.find(c => c.id === commentId)
    
    if (!comment) return
    
    addToast?.({
      type: 'info',
      title: 'Unarchiving Comment',
      message: 'Processing your request...'
    })
    
    setLoading(commentId)
    
    // Optimistic update - remove from archived and add to active comments
    setLocalArchivedComments(prev => prev.filter(c => c.id !== commentId))
    
    // Add to active comments with archived flag set to false
    const unarchived = { ...comment, archived: false }
    setLocalComments(prev => [unarchived, ...prev])
    
    try {
      await DataService.unarchiveComment(commentId)
      onCommentsUpdate('unarchive', comment)
      
      addToast?.({
        type: 'success',
        title: 'Comment Unarchived',
        message: 'The comment has been restored successfully'
      })
    } catch (error) {
      console.error('Error unarchiving comment:', error)
      // Revert both optimistic updates
      setLocalArchivedComments(archivedComments)
      setLocalComments(comments)
      
      addToast?.({
        type: 'error',
        title: 'Failed to Unarchive Comment',
        message: 'An error occurred while unarchiving the comment'
      })
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment? This action cannot be undone.")) return
    
    // Check if comment is in regular comments or archived comments
    const isRegularComment = localComments.some(c => c.id === commentId)
    const isArchivedComment = localArchivedComments.some(c => c.id === commentId)
    
    const comment = isRegularComment 
      ? localComments.find(c => c.id === commentId)
      : localArchivedComments.find(c => c.id === commentId)
    
    if (!comment) return
    
    // Show info toast before operation
    addToast?.({
      type: 'info',
      title: 'Deleting Comment',
      message: 'Processing your request...'
    })
    
    setLoading(commentId)
    
    // Store original lists for potential rollback
    const originalComments = [...localComments]
    const originalArchivedComments = [...localArchivedComments]
    
    // Optimistic update - remove from appropriate list
    if (isRegularComment) {
      setLocalComments(prev => prev.filter(c => c.id !== commentId))
    } else if (isArchivedComment) {
      setLocalArchivedComments(prev => prev.filter(c => c.id !== commentId))
    }
    
    try {
      // Use external mutation if provided, otherwise use local mutation
      if (externalDeleteMutation) {
        await externalDeleteMutation(commentId)
      } else {
        await deleteCommentMutation(commentId)
      }
      
      // We'll trust the mutation response and React Query invalidation
      // The DataService.deleteComment method already has verification built in
      
      onCommentsUpdate('delete', comment)
      
      // Show success toast after operation completes
      addToast?.({
        type: 'success',
        title: 'Comment Deleted',
        message: 'The comment has been permanently removed.'
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      
      // Revert optimistic update by restoring original lists
      setLocalComments(originalComments)
      setLocalArchivedComments(originalArchivedComments)
      
      // Show detailed error toast
      addToast?.({
        type: 'error',
        title: 'Error Deleting Comment',
        message: `Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(null)
    }
  }

  if (localComments.length === 0 && localArchivedComments.length === 0) {
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
    <div className="space-y-6">
      {/* Archive Toggle */}
      {localArchivedComments.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Archive className="h-4 w-4" />
            {showArchived ? 'Hide Archived' : `Show Archived (${localArchivedComments.length})`}
          </button>
        </div>
      )}
      {/* Archived Comments */}
      {showArchived && localArchivedComments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Archive className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-foreground">
              Archived Comments ({localArchivedComments.length})
            </h3>
          </div>
          <div className="space-y-4">
            {localArchivedComments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onApprove={handleApprove}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onDelete={handleDelete}
                loading={loading === comment.id}
                isPending={false}
                isArchived={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Comments */}
      {pendingComments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-foreground">
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
                onUnarchive={handleUnarchive}
                onDelete={handleDelete}
                loading={loading === comment.id}
                isPending={true}
                isArchived={false}
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
                onUnarchive={handleUnarchive}
                onDelete={handleDelete}
                loading={loading === comment.id}
                isPending={false}
                isArchived={false}
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
  onApprove: (commentId: string) => void
  onArchive: (commentId: string) => void
  onUnarchive: (commentId: string) => void
  onDelete: (commentId: string) => void
  loading: boolean
  isPending: boolean
  isArchived: boolean
}

function CommentCard({ comment, onApprove, onArchive, onUnarchive, onDelete, loading, isPending, isArchived }: CommentCardProps) {
  return (
    <div className={`bg-card rounded-xl border p-4 ${isPending ? 'backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 border-orange-700/50  bg-stone-500/30 ring-2 ring-orange-500/60 dark:border-orange-800 dark:bg-stone-600/40 dark:ring-orange-600/70' : isArchived ? 'backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 bg-gray-700/30 dark:bg-gray-100/30 ring-2 ring-gray-500/60 dark:ring-gray-600/70 dark:border-gray-600/70' : 'backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 bg-green-700/30 dark:bg-green-100/30 ring-2 ring-green-500/60 dark:ring-green-600/70 dark:border-green-600/70'}`}>
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
        {/* Show approve button only for pending comments that are not archived */}
        {isPending && !isArchived && (
          <button
            onClick={() => onApprove(comment.id)}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Check className="h-3 w-3" />
            {loading ? 'Approving...' : 'Approve'}
          </button>
        )}
        
        {/* Show archive button for all non-archived comments */}
        {!isArchived && (
          <button
            onClick={() => onArchive(comment.id)}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
            title="Archive"
          >
            <Archive className="h-3 w-3" />
            {loading ? '...' : ''}
          </button>
        )}
        
        {/* Show unarchive button only for archived comments */}
        {isArchived && (
          <button
            onClick={() => onUnarchive(comment.id)}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
            title="Unarchive"
          >
            <ArchiveRestore className="h-3 w-3" />
            {loading ? '...' : ''}
          </button>
        )}
        
        {/* Delete button for all comments */}
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
