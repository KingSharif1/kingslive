"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { lazy, Suspense } from 'react'

// Import services
import { AuthService } from "../services/authService"

// Import components
import Header from "./Header"
import Navigation from "./Navigation"
import AuthForm from "./AuthForm"
import PostList from "./PostList"
import PostForm from "./PostForm"
import StatsCards from "./StatsCards"
import LoadingScreen from "./LoadingScreen"
import Pagination from "./Pagination"
import PostEditor from "./PostEditor"
import AnalyticsDashboard from "./AnalyticsDashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Lazy load heavy components
const CommentsSection = lazy(() => import("./CommentsSection"))
const AnalyticsPage = lazy(() => import("./AnalyticsPage"))

// Import React Query hooks
import { 
  useComments, 
  useArchivedComments, 
  usePosts, 
  useAllPosts,
  useStats,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useDeleteComment
} from "../hooks/useQueries"

import { BlogPost } from "../types"

// Define section type
type Section = 'posts' | 'comments' | 'analytics' | 'post-editor'

interface CtroomContentProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

export default function CtroomContent({ addToast }: CtroomContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Auth state
  const [authLoading, setAuthLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{id: string, email: string, username?: string, isAdmin: boolean} | null>(null)
  const [email, setEmail] = useState('')
  const [authError, setAuthError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  
  // UI state
  const [activeSection, setActiveSection] = useState<Section>('posts')
  const [isEditing, setIsEditing] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Post form state
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    published: false,
    featured: false,
  })
  
  const [editingPostTags, setEditingPostTags] = useState<string[]>([])
  const [newPostTags, setNewPostTags] = useState<string[]>([])
  const [editTag, setEditTag] = useState('')
  const [newTag, setNewTag] = useState('')
  
  const [editingPostKeywords, setEditingPostKeywords] = useState<string[]>([])
  const [newPostKeywords, setNewPostKeywords] = useState<string[]>([])
  const [editKeyword, setEditKeyword] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  
  const [activeTab, setActiveTab] = useState(0)
  
  // React Query hooks
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = usePosts(0, 10)
  const { data: allPosts, isLoading: allPostsLoading } = useAllPosts()
  const { data: comments, isLoading: commentsLoading } = useComments()
  const { data: archivedComments, isLoading: archivedCommentsLoading } = useArchivedComments()
  const { data: stats, isLoading: statsLoading } = useStats()
  
  const { mutateAsync: createPost, isPending: isCreatingMutation } = useCreatePost()
  const { mutateAsync: updatePost, isPending: isUpdatingPost } = useUpdatePost()
  const { mutateAsync: deletePost, isPending: isDeleting } = useDeletePost()
  const { mutateAsync: deleteComment } = useDeleteComment()
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const postsPerPage = 10
  const totalPosts = posts?.count || 0
  
  // Mock analytics data
  const analyticsData = {
    totalViews: stats?.totalViews || 0,
    viewsToday: stats?.viewsToday || 0,
    viewsThisWeek: stats?.viewsThisWeek || 0,
    viewsThisMonth: stats?.viewsThisMonth || 0,
    topPosts: allPosts?.slice(0, 5).map(post => ({
      title: post.title,
      views: post.views || 0,
      slug: post.slug
    })) || [],
    viewsOverTime: [
      { date: '2023-01', views: 120 },
      { date: '2023-02', views: 240 },
      { date: '2023-03', views: 180 },
      { date: '2023-04', views: 350 },
      { date: '2023-05', views: 280 },
      { date: '2023-06', views: 420 },
    ],
    viewsByDay: [
      { date: '2023-06-01', views: 42 },
      { date: '2023-06-02', views: 36 },
      { date: '2023-06-03', views: 51 },
      { date: '2023-06-04', views: 28 },
      { date: '2023-06-05', views: 39 },
    ],
    engagement: 0.64
  }
  
  // Check for URL params on mount
  useEffect(() => {
    const createParam = searchParams.get('create')
    const editParam = searchParams.get('edit')
    
    if (createParam === 'true') {
      setIsCreating(true)
    } else if (editParam) {
      const postId = editParam
      const postToEdit = allPosts?.find(p => p.id === postId)
      
      if (postToEdit) {
        setEditingPost(postToEdit)
        setEditingPostTags(postToEdit.tags || [])
        setEditingPostKeywords(postToEdit.keywords || [])
        setIsEditing(true)
      }
    }
  }, [searchParams, allPosts])
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true)
      try {
        const { user, error } = await AuthService.getCurrentUser()
        
        if (user) {
          setUser(user)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth error:', error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setAuthLoading(false)
      }
    }
    
    checkAuth()
  }, [])
  
  // Login handler
  const handleLogin = async (emailToLogin: string) => {
    setIsAuthLoading(true)
    setAuthError('')
    
    try {
      // Simple validation
      if (!emailToLogin || !emailToLogin.includes('@')) {
        const errorMsg = 'Please enter a valid email address'
        setAuthError(errorMsg)
        addToast({
          type: 'error',
          title: 'Invalid Email',
          message: errorMsg
        })
        return
      }
      
      // Check if user is authorized admin via secure API
      const adminResponse = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToLogin.trim() }),
      })
      
      const adminResult = await adminResponse.json()
      console.log('Admin users result:', adminResult)
      
      if (!adminResponse.ok) {
        const errorMsg = adminResult.error || 'Error checking admin status'
        setAuthError(errorMsg)
        addToast({
          type: 'error',
          title: 'Database Error',
          message: errorMsg
        })
        return
      }
      
      if (!adminResult.isAdmin) {
        const errorMsg = 'Access denied. Only admin users can login.'
        setAuthError(errorMsg)
        addToast({
          type: 'error',
          title: 'Access Denied',
          message: errorMsg
        })
        return
      }
      
      // Send magic link
      const { error } = await AuthService.signInWithMagicLink(emailToLogin)
      
      if (error) {
        setAuthError(error.message)
        addToast({
          type: 'error',
          title: 'Login Failed',
          message: error.message
        })
        return
      }
      
      setEmail(emailToLogin)
      setMagicLinkSent(true)
      
      addToast({
        type: 'success',
        title: 'Magic Link Sent',
        message: 'Check your email to complete sign in'
      })
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMsg = error.message || 'An error occurred during login'
      setAuthError(errorMsg)
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: errorMsg
      })
    } finally {
      setIsAuthLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    try {
      await AuthService.signOut()
      window.location.href = '/ctroom'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }
  
  // Tag management functions
  const handleRemoveTag = (tagToRemove: string, isNewPost: boolean) => {
    if (isNewPost) {
      setNewPostTags(newPostTags.filter(tag => tag !== tagToRemove))
    } else {
      setEditingPostTags(editingPostTags.filter(tag => tag !== tagToRemove))
    }
  }
  
  const handleAddTag = (isNewPost: boolean) => {
    const tagToAdd = isNewPost ? newTag : editTag
    if (!tagToAdd.trim()) return
    
    if (isNewPost) {
      if (!newPostTags.includes(tagToAdd)) {
        setNewPostTags([...newPostTags, tagToAdd])
      }
      setNewTag('')
    } else {
      if (!editingPostTags.includes(tagToAdd)) {
        setEditingPostTags([...editingPostTags, tagToAdd])
      }
      setEditTag('')
    }
  }
  
  const handleAddKeyword = (isNewPost: boolean) => {
    const keywordToAdd = isNewPost ? newKeyword : editKeyword
    if (!keywordToAdd.trim()) return
    
    if (isNewPost) {
      if (!newPostKeywords.includes(keywordToAdd)) {
        setNewPostKeywords([...newPostKeywords, keywordToAdd])
      }
      setNewKeyword('')
    } else {
      if (!editingPostKeywords.includes(keywordToAdd)) {
        setEditingPostKeywords([...editingPostKeywords, keywordToAdd])
      }
      setEditKeyword('')
    }
  }
  
  const handleRemoveKeyword = (keywordToRemove: string, isNewPost: boolean) => {
    if (isNewPost) {
      setNewPostKeywords(newPostKeywords.filter(keyword => keyword !== keywordToRemove))
    } else {
      setEditingPostKeywords(editingPostKeywords.filter(keyword => keyword !== keywordToRemove))
    }
  }
  
  // Post management with React Query
  const handleCreateNewPost = async (postData?: any) => {
    try {
      // If postData is provided, use it; otherwise use form state
      const postToCreate = postData || {
        ...newPost,
        tags: newPostTags,
        keywords: newPostKeywords,
      }
      
      if (!postToCreate.title || !postToCreate.content) {
        addToast({
          type: 'error',
          title: 'Missing fields',
          message: 'Please fill in all required fields'
        })
        return
      }

      await createPost(postToCreate)
      
      // Reset form if not using external data
      if (!postData) {
        setNewPost({
          title: '',
          slug: '',
          content: '',
          excerpt: '',
          published: false,
          featured: false,
        })
        setNewPostTags([])
        setNewPostKeywords([])
        
        // Navigate back to posts list
        router.push('/ctroom')
      }
      
      addToast({
        type: 'success',
        title: 'Post created',
        message: `Successfully created "${postToCreate.title}"`
      })
    } catch (error: any) {
      console.error('Error creating post:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create post'
      })
    }
  }
  
  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post)
    setEditingPostTags(post.tags || [])
    setEditingPostKeywords(post.keywords || [])
    setIsEditing(true)
    // Use URL navigation to persist edit state
    router.push(`/ctroom?edit=${post.id}`)
  }
  
  const handleUpdatePost = async (postData?: any) => {
    try {
      if (!editingPost || !editingPost.id) {
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'No post selected for editing'
        })
        return
      }
      
      if (!editingPost.title || !editingPost.content) {
        addToast({
          type: 'error',
          title: 'Missing fields',
          message: 'Please fill in all required fields'
        })
        return
      }
      
      const postToUpdate = postData || {
        ...editingPost,
        tags: editingPostTags,
        keywords: editingPostKeywords
      }
      
      await updatePost(postToUpdate)
      
      // Navigate back to posts list
      router.push('/ctroom')
      
      addToast({
        type: 'success',
        title: 'Post updated',
        message: `Successfully updated "${editingPost.title}"`
      })
    } catch (error) {
      console.error('Error updating post:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update post'
      })
    }
  }
  
  const handleDeletePost = async (postId: string, postTitle: string) => {
    try {
      await deletePost(postId)
      
      addToast({
        type: 'success',
        title: 'Post deleted',
        message: `Successfully deleted "${postTitle}"`
      })
    } catch (error) {
      console.error('Error deleting post:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete post'
      })
    }
  }
  
  // If auth is loading, show loading screen
  if (authLoading) {
    return <LoadingScreen />
  }
  
  // If not authenticated, show auth form
  if (!isAuthenticated) {
    return (
      <AuthForm 
        email={email}
        setEmail={setEmail}
        authError={authError}
        magicLinkSent={magicLinkSent}
        isLoading={isAuthLoading}
        onLogin={handleLogin}
      />
    )
  }
  
  const isLoading = postsLoading || commentsLoading || statsLoading
  const isSaving = isCreatingMutation || isUpdatingPost || isDeleting
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col min-h-screen">
        <Header user={user} onSignOut={handleSignOut} />
        
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <StatsCards stats={stats || { totalPosts: 0, publishedPosts: 0, totalComments: 0, pendingComments: 0, totalViews: 0, featuredPosts: 0 }} />
          
          <Navigation 
            activeSection={activeSection}
            pendingComments={stats?.pendingComments || 0}
            isCreating={isCreating}
            onSectionChange={(section) => {
              setActiveSection(section)
              setIsEditing(false)
              setIsCreating(false)
            }}
            onCreateNew={() => {
              // Use URL navigation to persist create state
              router.push('/ctroom?create=true')
            }}
          />
          
          <div className="space-y-6 backdrop-blur-2xl backdrop-contrast-150 backdrop-brightness-150">
            {isLoading ? (
              <div className="bg-card rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            ) : (
              <>
                {activeSection === 'posts' && !isEditing && !isCreating && (
                  <>
                    <PostList 
                      posts={posts?.data || []}
                      handleEditPost={handleEditPost}
                      handleDeletePost={handleDeletePost}
                    />
                    <Pagination 
                      currentPage={currentPage}
                      totalItems={totalPosts}
                      itemsPerPage={postsPerPage}
                      onPageChange={setCurrentPage}
                      isLoading={postsLoading}
                    />
                  </>
                )}
                
                {isCreating && (
                  <div className="bg-slate-200 dark:bg-slate-900 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Create New Post</h2>
                    <PostForm 
                      post={newPost}
                      setPost={(updatedPost) => setNewPost(prev => ({ ...prev, ...updatedPost }))}
                      tags={newPostTags}
                      setTags={setNewPostTags}
                      keywords={newPostKeywords}
                      setKeywords={setNewPostKeywords}
                      newTag={newTag}
                      setNewTag={setNewTag}
                      newKeyword={newKeyword}
                      setNewKeyword={setNewKeyword}
                      handleAddTag={() => handleAddTag(true)}
                      handleRemoveTag={(tag) => handleRemoveTag(tag, true)}
                      handleAddKeyword={() => handleAddKeyword(true)}
                      handleRemoveKeyword={(keyword) => handleRemoveKeyword(keyword, true)}
                      handleSave={handleCreateNewPost}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      onCancel={() => router.push('/ctroom')}
                    />
                  </div>
                )}
                
                {isEditing && editingPost && (
                  <div className="bg-slate-200 dark:bg-slate-900 text-foreground backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Edit Post</h2>
                    <PostForm 
                      post={editingPost}
                      setPost={(updatedPost) => setEditingPost(prev => prev ? { ...prev, ...updatedPost } : null)}
                      tags={editingPostTags}
                      setTags={setEditingPostTags}
                      keywords={editingPostKeywords}
                      setKeywords={setEditingPostKeywords}
                      newTag={editTag}
                      setNewTag={setEditTag}
                      newKeyword={editKeyword}
                      setNewKeyword={setEditKeyword}
                      handleAddTag={() => handleAddTag(false)}
                      handleRemoveTag={(tag) => handleRemoveTag(tag, false)}
                      handleAddKeyword={() => handleAddKeyword(false)}
                      handleRemoveKeyword={(keyword) => handleRemoveKeyword(keyword, false)}
                      handleSave={handleUpdatePost}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      onCancel={() => router.push('/ctroom')}
                    />
                  </div>
                )}
                
                {activeSection === 'comments' && (
                  <Suspense fallback={<LoadingScreen />}>
                    <CommentsSection 
                      comments={comments || []} 
                      archivedComments={archivedComments || []}
                      onCommentsUpdate={() => {}} // React Query handles this automatically
                      addToast={addToast}
                      deleteCommentMutation={deleteComment}
                    />
                  </Suspense>
                )}
                
                {activeSection === 'analytics' && (
                  <Suspense fallback={<LoadingScreen />}>
                    <AnalyticsDashboard data={analyticsData} />
                  </Suspense>
                )}
                
                {activeSection === 'post-editor' && (
                  <div className="bg-slate-200 dark:bg-slate-900 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
                    <PostEditor
                      initialPost={editingPost ? {
                        id: editingPost.id,
                        title: editingPost.title,
                        slug: editingPost.slug,
                        content: editingPost.content,
                        excerpt: editingPost.excerpt || '',
                        tags: editingPostTags,
                        published: editingPost.published
                      } : undefined}
                      onSave={async (post) => {
                        if (post.id) {
                          await handleUpdatePost({
                            ...post,
                            id: post.id
                          })
                        } else {
                          await handleCreateNewPost({
                            ...post,
                            keywords: []
                          })
                        }
                        setActiveSection('posts')
                        addToast({
                          type: 'success',
                          title: post.id ? 'Post updated' : 'Post created',
                          message: `Successfully ${post.id ? 'updated' : 'created'} "${post.title}"`
                        })
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
