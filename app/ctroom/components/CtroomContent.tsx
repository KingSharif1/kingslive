"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { signOut, getCurrentUser, signInWithMagicLink } from "@/lib/auth"
import { useToast, ToastContainer } from '../components/Toast'
import Header from "./Header"
import Navigation from "./Navigation"
import AuthForm from "./AuthForm"
import { lazy, Suspense } from 'react'
import PostList from "./PostList"
import PostForm from "./PostForm"
import StatsCards from "./StatsCards"
import LoadingScreen from "./LoadingScreen"
import Pagination from "./Pagination"

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
type Section = 'posts' | 'comments' | 'analytics'

export default function CtroomContent() {
  const { toasts, addToast, removeToast } = useToast()
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
  const [activeTab, setActiveTab] = useState("content")
  
  // Form state
  const [newTag, setNewTag] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [editTag, setEditTag] = useState("")
  const [editKeyword, setEditKeyword] = useState("")
  const [newPostTags, setNewPostTags] = useState<string[]>([])
  const [editingPostTags, setEditingPostTags] = useState<string[]>([])
  const [newPostKeywords, setNewPostKeywords] = useState<string[]>([])
  const [editingPostKeywords, setEditingPostKeywords] = useState<string[]>([])
  
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: "",
    excerpt: "",
    content: "",
    author: "King Sharif",
    tags: [],
    meta_keywords: [],
    published: false,
    featured: false,
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [postsPerPage] = useState(5) // Show 5 posts per page

  // React Query hooks
  const { data: postsData, isLoading: postsLoading, error: postsError } = usePosts(currentPage, postsPerPage)
  const { data: allPosts = [] } = useAllPosts() // For analytics that need all posts
  const { data: comments = [], isLoading: commentsLoading, error: commentsError } = useComments()
  const { data: archivedComments = [], isLoading: archivedCommentsLoading, error: archivedCommentsError } = useArchivedComments()
  const { data: stats, isLoading: statsLoading, error: statsError } = useStats()
  const { mutateAsync: deleteComment } = useDeleteComment()

  // Extract posts and count from paginated data
  const posts = allPosts || []
  const totalPosts = postsData?.count || 0

  // Mutations
  const { mutateAsync: createPost, isPending: isCreatingMutation } = useCreatePost()
  const { mutateAsync: updatePost, isPending: isUpdatingPost } = useUpdatePost()
  const { mutateAsync: deletePost, isPending: isDeleting } = useDeletePost()


  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true)
      try {
        const user = await getCurrentUser()
        setIsAuthenticated(!!user && user.isAdmin)
        if (user && user.isAdmin) {
          setUser(user)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setAuthLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  // Handle URL parameters for edit state persistence
  useEffect(() => {
    const editPostId = searchParams.get('edit')
    const createNew = searchParams.get('create')
    
    if (editPostId && posts.length > 0) {
      const postToEdit = posts.find(p => p.id === editPostId)
      if (postToEdit) {
        setEditingPost(postToEdit)
        setEditingPostTags(postToEdit.tags || [])
        setEditingPostKeywords(postToEdit.meta_keywords || [])
        setIsEditing(true)
        setIsCreating(false)
      }
    } else if (createNew === 'true') {
      setIsCreating(true)
      setIsEditing(false)
      setEditingPost(null)
    } else {
      // No URL params, reset to main view
      setIsEditing(false)
      setIsCreating(false)
      setEditingPost(null)
    }
  }, [searchParams, posts])

  const handleLogin = async (emailToLogin: string) => {
    setIsAuthLoading(true)
    setAuthError('')

    try {
      if (!emailToLogin.includes('@')) {
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
        const errorMsg = 'False! IMPOSTER'
        setAuthError(errorMsg)
        addToast({
          type: 'error',
          title: 'Access Denied',
          message: errorMsg
        })
        return
      }

      // Send magic link
      await signInWithMagicLink(emailToLogin)

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
      await signOut()
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
  const handleCreateNewPost = async () => {
    try {
      if (!newPost.title || !newPost.content) {
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'Title and content are required'
        })
        return
      }
      
      addToast({
        type: 'info',
        title: 'Creating Post',
        message: 'Creating your blog post...'
      })
      
      const postToCreate = {
        ...newPost,
        tags: newPostTags,
        meta_keywords: newPostKeywords,
        author: user?.username || user?.email || 'Admin'
      }
      
      await createPost(postToCreate)
      
      // Reset form
      setNewPost({
        title: "",
        excerpt: "",
        content: "",
        author: "King Sharif",
        tags: [],
        meta_keywords: [],
        published: false,
        featured: false,
      })
      setNewPostTags([])
      setNewPostKeywords([])
      setNewTag('')
      setNewKeyword('')
      
      // Navigate back to main view
      router.push('/ctroom')
      
      addToast({
        type: 'success',
        title: 'Post Created',
        message: 'Your blog post has been created successfully'
      })
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to Create Post',
        message: error.message || 'An error occurred while creating the post'
      })
    }
  }
  
  const handleEditPost = (post: BlogPost) => {
    // Use URL navigation to persist edit state
    router.push(`/ctroom?edit=${post.id}`)
  }
  
  const handleUpdatePost = async () => {
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
          title: 'Validation Error',
          message: 'Title and content are required'
        })
        return
      }
      
      addToast({
        type: 'info',
        title: 'Updating Post',
        message: 'Updating your blog post...'
      })
      
      const updatedPost = {
        ...editingPost,
        tags: editingPostTags,
        meta_keywords: editingPostKeywords
      }
      
      await updatePost({ id: editingPost.id, post: updatedPost })
      
      // Navigate back to main view
      router.push('/ctroom')
      
      addToast({
        type: 'success',
        title: 'Post Updated',
        message: 'Your blog post has been updated successfully'
      })
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to Update Post',
        message: error.message || 'An error occurred while updating the post'
      })
    }
  }
  
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    addToast({
      type: 'info',
      title: 'Deleting Post',
      message: 'Deleting your blog post...'
    })
    
    try {
      await deletePost(postId)
      
      addToast({
        type: 'success',
        title: 'Post Deleted',
        message: 'The blog post has been deleted successfully'
      })
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to Delete Post',
        message: error.message || 'An error occurred while deleting the post'
      })
    }
  }

  // Show loading screen while checking authentication
  if (authLoading) {
    return <LoadingScreen />
  }
  
  // If not authenticated, show login form
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
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
                      posts={posts}
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
                      comments={comments} 
                      archivedComments={archivedComments}
                      onCommentsUpdate={() => {}} // React Query handles this automatically
                      addToast={addToast}
                      deleteCommentMutation={deleteComment}
                    />
                  </Suspense>
                )}
                
                {activeSection === 'analytics' && (
                  <Suspense fallback={<LoadingScreen />}>
                    <AnalyticsPage posts={allPosts} comments={comments} />
                  </Suspense>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
