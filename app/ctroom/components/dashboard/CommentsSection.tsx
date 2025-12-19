"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Check, X, Flag, Clock, AlertTriangle, RefreshCw, MessageCircle } from "lucide-react"

interface Comment {
  id: string
  post_id: string
  author_name: string
  author_email: string
  content: string
  approved: boolean
  created_at: string
  archived: boolean
  flagged: boolean
  flag_reason: string | null
}

interface CommentsSectionProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

export function CommentsSection({ addToast }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  // Fetch comments from Supabase
  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('id, post_id, author_name, author_email, content, approved, created_at, archived, flagged, flag_reason')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching comments:', error)
        setComments([])
        return
      }
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
      setComments([])
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch comments'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [])

  // Filter comments by status
  const pendingComments = comments.filter(c => !c.approved && !c.archived && !c.flagged)
  const approvedComments = comments.filter(c => c.approved && !c.archived)
  const flaggedComments = comments.filter(c => c.flagged || c.archived)

  // Approve comment
  const handleApprove = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ approved: true, flagged: false })
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, approved: true, flagged: false } : c
      ))

      addToast({
        type: 'success',
        title: 'Comment Approved',
        message: 'Comment is now visible on the blog'
      })
    } catch (err) {
      console.error('Error approving comment:', err)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to approve comment'
      })
    }
  }

  // Delete/Archive comment
  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ archived: true })
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, archived: true } : c
      ))

      addToast({
        type: 'success',
        title: 'Comment Deleted',
        message: 'Comment has been archived'
      })
    } catch (err) {
      console.error('Error deleting comment:', err)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete comment'
      })
    }
  }

  // Flag comment as spam
  const handleFlag = async (commentId: string, reason: string = 'Marked as spam') => {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ flagged: true, flag_reason: reason, approved: false })
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, flagged: true, flag_reason: reason, approved: false } : c
      ))

      addToast({
        type: 'success',
        title: 'Comment Flagged',
        message: 'Comment has been flagged as spam'
      })
    } catch (err) {
      console.error('Error flagging comment:', err)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to flag comment'
      })
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Check if comment will auto-approve soon (within 24h)
  const getAutoApproveStatus = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursPassed = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    const hoursRemaining = Math.max(0, 24 - hoursPassed)
    
    if (hoursRemaining <= 0) return { willAutoApprove: true, hoursRemaining: 0 }
    return { willAutoApprove: false, hoursRemaining: Math.ceil(hoursRemaining) }
  }

  // Comment card component
  const CommentCard = ({ comment, showActions = true }: { comment: Comment; showActions?: boolean }) => {
    const autoApprove = getAutoApproveStatus(comment.created_at)
    
    return (
      <div className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {comment.author_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{comment.author_name}</p>
              <p className="text-xs text-muted-foreground">{comment.author_email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {comment.flagged && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Flagged
              </Badge>
            )}
            {!comment.approved && !comment.flagged && autoApprove.hoursRemaining > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Auto-approve in {autoApprove.hoursRemaining}h
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
          </div>
        </div>
        
        <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Post ID: <span className="font-mono">{comment.post_id.slice(0, 8)}...</span>
          </p>
          
          {showActions && (
            <div className="flex gap-2">
              {!comment.approved && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleApprove(comment.id)}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Approve
                </Button>
              )}
              {!comment.flagged && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                  onClick={() => handleFlag(comment.id)}
                >
                  <Flag className="w-3 h-3 mr-1" />
                  Spam
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleDelete(comment.id)}
              >
                <X className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
        
        {comment.flag_reason && (
          <p className="text-xs text-red-500 mt-2">
            Flag reason: {comment.flag_reason}
          </p>
        )}
      </div>
    )
  }

  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-8">
      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comments</CardTitle>
            <CardDescription>Manage comments on your blog posts</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchComments}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingComments.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {pendingComments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              {approvedComments.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {approvedComments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="flagged">
              Flagged/Spam
              {flaggedComments.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                  {flaggedComments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-muted rounded mb-2" />
                  <div className="h-4 w-2/3 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="pending" className="space-y-4 mt-0">
                {pendingComments.length === 0 ? (
                  <EmptyState message="No pending comments to review" />
                ) : (
                  pendingComments.map(comment => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4 mt-0">
                {approvedComments.length === 0 ? (
                  <EmptyState message="No approved comments yet" />
                ) : (
                  approvedComments.map(comment => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="flagged" className="space-y-4 mt-0">
                {flaggedComments.length === 0 ? (
                  <EmptyState message="No flagged or spam comments" />
                ) : (
                  flaggedComments.map(comment => (
                    <CommentCard key={comment.id} comment={comment} showActions={true} />
                  ))
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
