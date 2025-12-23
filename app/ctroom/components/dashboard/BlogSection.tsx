"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { getAllPosts } from "@/lib/sanity-queries"
import { 
  FileText, ExternalLink, RefreshCw, Eye, Check, X, 
  MessageCircle, Clock, ChevronRight, Newspaper, PenLine
} from "lucide-react"

interface SanityPost {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
}

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

interface BlogSectionProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

export function BlogSection({ addToast }: BlogSectionProps) {
  const [posts, setPosts] = useState<SanityPost[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [isLoadingComments, setIsLoadingComments] = useState(true)
  const [selectedPost, setSelectedPost] = useState<SanityPost | null>(null)
  const [activeTab, setActiveTab] = useState('posts')

  // Fetch posts from Sanity
  const fetchPosts = async () => {
    setIsLoadingPosts(true)
    try {
      const data = await getAllPosts()
      setPosts(data || [])
    } catch (err) {
      console.error('Error fetching posts:', err)
      setPosts([])
    } finally {
      setIsLoadingPosts(false)
    }
  }

  // Fetch comments from Supabase
  const fetchComments = async () => {
    setIsLoadingComments(true)
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
      setComments([])
    } finally {
      setIsLoadingComments(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    fetchComments()
  }, [])

  // Get comments for a specific post
  const getPostComments = (postSlug: string) => {
    return comments.filter(c => c.post_id === postSlug && !c.archived)
  }

  // Get pending comments count for a post
  const getPendingCount = (postSlug: string) => {
    return comments.filter(c => c.post_id === postSlug && !c.approved && !c.archived && !c.flagged).length
  }

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

      addToast({ type: 'success', title: 'Comment Approved' })
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to approve comment' })
    }
  }

  // Delete comment
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

      addToast({ type: 'success', title: 'Comment Deleted' })
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete comment' })
    }
  }

  // Total pending comments
  const totalPending = comments.filter(c => !c.approved && !c.archived && !c.flagged).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6" />
            Blog Management
          </h1>
          <p className="text-sm text-muted-foreground">Manage your posts and comments in one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchPosts(); fetchComments(); }}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPosts || isLoadingComments ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => window.open('https://kingslive.sanity.studio/structure/post', '_blank')}>
            <PenLine className="h-4 w-4 mr-2" />
            New Post
            <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{posts.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Comments</p>
                <p className="text-2xl font-bold">{comments.filter(c => !c.archived).length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{totalPending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Posts List */}
        <Card className="h-[500px] flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts
            </CardTitle>
            <CardDescription>Click a post to view its comments</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4 pb-4">
              {isLoadingPosts ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No posts found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {posts.map((post) => {
                    const pendingCount = getPendingCount(post.slug.current)
                    const isSelected = selectedPost?._id === post._id
                    return (
                      <div 
                        key={post._id} 
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedPost(post)}
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-medium truncate text-sm">{post.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric' 
                            }) : 'Draft'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {pendingCount > 0 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              {pendingCount} pending
                            </Badge>
                          )}
                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Comments for Selected Post */}
        <Card className="h-[500px] flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Comments
                </CardTitle>
                <CardDescription>
                  {selectedPost ? `For: ${selectedPost.title}` : 'Select a post to view comments'}
                </CardDescription>
              </div>
              {selectedPost && (
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/blog/${selectedPost.slug.current}`, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/studio/structure/post;${selectedPost._id}`, '_blank')}
                  >
                    Edit
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4 pb-4">
              {!selectedPost ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mb-2 opacity-30" />
                  <p className="text-sm">Select a post to view its comments</p>
                </div>
              ) : isLoadingComments ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Tabs for comment status */}
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="w-full mb-3">
                      <TabsTrigger value="pending" className="flex-1">
                        Pending ({getPostComments(selectedPost.slug.current).filter(c => !c.approved && !c.flagged).length})
                      </TabsTrigger>
                      <TabsTrigger value="approved" className="flex-1">
                        Approved ({getPostComments(selectedPost.slug.current).filter(c => c.approved).length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="pending" className="space-y-2 mt-0">
                      {getPostComments(selectedPost.slug.current).filter(c => !c.approved && !c.flagged).length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No pending comments</p>
                      ) : (
                        getPostComments(selectedPost.slug.current)
                          .filter(c => !c.approved && !c.flagged)
                          .map(comment => (
                            <div key={comment.id} className="p-3 rounded-lg border bg-muted/30">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{comment.author_name}</p>
                                  <p className="text-xs text-muted-foreground">{comment.author_email}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={() => handleApprove(comment.id)}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100" onClick={() => handleDelete(comment.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm mt-2 text-muted-foreground">{comment.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))
                      )}
                    </TabsContent>
                    
                    <TabsContent value="approved" className="space-y-2 mt-0">
                      {getPostComments(selectedPost.slug.current).filter(c => c.approved).length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">No approved comments</p>
                      ) : (
                        getPostComments(selectedPost.slug.current)
                          .filter(c => c.approved)
                          .map(comment => (
                            <div key={comment.id} className="p-3 rounded-lg border">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{comment.author_name}</p>
                                </div>
                                <Badge variant="outline" className="text-green-600 border-green-300">Approved</Badge>
                              </div>
                              <p className="text-sm mt-2 text-muted-foreground">{comment.content}</p>
                            </div>
                          ))
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
