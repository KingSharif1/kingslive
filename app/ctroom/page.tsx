"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, MessageSquare, BarChart, Star, Edit, Trash2, X, Mail, Check, Save, Eye, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { signOut, getCurrentUser, subscribeToAuthChanges, signInWithMagicLink } from "@/lib/auth"
import { useToast, ToastContainer } from './components/Toast'
import Header from "./components/Header"
import Navigation from "./components/Navigation"

// Import components
import AuthForm from "./components/AuthForm"
import PostList from "./components/PostList"
import PostForm from "./components/PostForm"
import StatsCards from "./components/StatsCards"
import CommentsSection from "./components/CommentsSection"
import AnalyticsPage from "./components/AnalyticsPage"
import LoadingScreen from "./components/LoadingScreen"

// Import services
import { DataService } from "./services/dataService"

// Import types
import { BlogPost, Category, Comment, PostAnalytics } from "./types"

// Define section type
type SectionType = 'posts' | 'comments' | 'analytics'

// Sample data for initial state
const SAMPLE_POSTS: BlogPost[] = []

export default function CtroomPage() {
  // State for authentication
  const [isLoading, setIsLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true) // New state for auth loading
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [authError, setAuthError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [user, setUser] = useState<{id: string, email: string, username?: string, isAdmin: boolean} | null>(null)
  
  // State for blog posts and related data
  const [posts, setPosts] = useState<BlogPost[]>(SAMPLE_POSTS)
  const [categories, setCategories] = useState<Category[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    totalComments: 0,
    pendingComments: 0,
    totalViews: 0,
    featuredPosts: 0
  })
  const [error, setError] = useState("")
  
  // State for post editing
  const [isEditing, setIsEditing] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState("content") // content, seo, settings
  const [activeSection, setActiveSection] = useState<SectionType>('posts')
  const [isSaving, setIsSaving] = useState(false)
  
  // State for tags and keywords
  const [newTag, setNewTag] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [editTag, setEditTag] = useState("")
  const [editKeyword, setEditKeyword] = useState("")
  const [newPostTags, setNewPostTags] = useState<string[]>([])
  const [editingPostTags, setEditingPostTags] = useState<string[]>([])
  const [newPostKeywords, setNewPostKeywords] = useState<string[]>([])
  const [editingPostKeywords, setEditingPostKeywords] = useState<string[]>([])
  
  // Toast notifications
  const { toasts, addToast, removeToast } = useToast()
  
  // State for new post
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: "",
    excerpt: "",
    content: "",
    author: "King Sharif",
    tags: [],
    meta_keywords: [],
    published: false,
    featured: false,
    views: 0
  })

  // Fetch blog data from Supabase
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true) // Start auth loading
      try {
        const user = await getCurrentUser()
        setIsAuthenticated(!!user && user.isAdmin)
        if (user && user.isAdmin) {
          setUser(user)
          await fetchData()
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setAuthLoading(false) // End auth loading regardless of outcome
      }
    }
    
    checkAuth()
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthLoading(true) // Start auth loading on state change
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const user = await getCurrentUser()
          setIsAuthenticated(!!user && user.isAdmin)
          if (user) {
            setUser(user)
            await fetchData()
          }
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false)
          setUser(null)
        }
        setAuthLoading(false) // End auth loading after state change processed
      }
    )
    
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [postsData, categoriesData, commentsData, statsData] = await Promise.all([
        DataService.fetchPosts().catch((err) => {
          console.error('Error fetching posts:', err)
          return []
        }),
        DataService.fetchCategories().catch((err) => {
          console.error('Error fetching categories:', err)
          return []
        }),
        DataService.fetchComments().catch((err) => {
          console.error('Error fetching comments:', err)
          return []
        }),
        DataService.getStats().catch((err) => {
          console.error('Error fetching stats:', err)
          return {
            totalPosts: 0,
            publishedPosts: 0,
            totalComments: 0,
            pendingComments: 0,
            totalViews: 0,
            featuredPosts: 0
          }
        })
      ])
      
      setPosts(postsData)
      setCategories(categoriesData)
      setComments(commentsData)
      setStats(statsData)
      setError('') // Clear any previous errors
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch some data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (emailToLogin: string) => {
    setIsAuthLoading(true)
    setAuthError('')
    
    try {
      // Validate email format
      if (!emailToLogin.includes('@')) {
        setAuthError('Please enter a valid email address')
        return
      }
      
      // Check if email is in admin_users table
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', emailToLogin)
      
      if (adminError) {
        throw new Error('Error checking admin status')
      }
      
      // If not an admin email, show error and stop here - don't send magic link
      if (!adminUsers || adminUsers.length === 0) {
        setAuthError('You are not authorized to access this area')
        return
      }
      
      // Send magic link
      await signInWithMagicLink(emailToLogin)
      setMagicLinkSent(true)
    } catch (error: any) {
      console.error('Login error:', error)
      setAuthError(error.message || 'An error occurred during login')
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
  
  // Keyword management functions
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
  
  // Post management functions
  const handleCreateNewPost = async () => {
    try {
      if (!newPost.title || !newPost.content) {
        setError('Title and content are required')
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'Title and content are required'
        })
        return
      }
      
      // Toast notification before starting the operation
      addToast({
        type: 'info',
        title: 'Creating Post',
        message: 'Creating your blog post...'
      })
      
      setIsSaving(true)
      
      const postToCreate = {
        ...newPost,
        tags: newPostTags,
        meta_keywords: newPostKeywords,
        author: user?.username || user?.email || 'Admin'
      }
      
      await DataService.createPost(postToCreate)
      
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
        views: 0
      })
      setNewPostTags([])
      setNewPostKeywords([])
      setNewTag('')
      setNewKeyword('')
      setIsCreating(false)
      
      // Refresh data
      await fetchData()
      
      // Success toast after operation completes
      addToast({
        type: 'success',
        title: 'Post Created',
        message: 'Your blog post has been created successfully'
      })
    } catch (error: any) {
      console.error('Error creating post:', error)
      addToast({
        type: 'error',
        title: 'Failed to Create Post',
        message: error.message || 'An error occurred while creating the post'
      })
      setError(error.message || 'Failed to create post')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post)
    setEditingPostTags(post.tags || [])
    setEditingPostKeywords(post.meta_keywords || [])
    setIsEditing(true)
    setActiveTab('content')
  }
  
  const handleUpdatePost = async () => {
    try {
      if (!editingPost || !editingPost.id) {
        setError('No post selected for editing')
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'No post selected for editing'
        })
        return
      }
      
      if (!editingPost.title || !editingPost.content) {
        setError('Title and content are required')
        addToast({
          type: 'error',
          title: 'Validation Error',
          message: 'Title and content are required'
        })
        return
      }
      
      // Toast notification before starting the operation
      addToast({
        type: 'info',
        title: 'Updating Post',
        message: 'Updating your blog post...'
      })
      
      setIsSaving(true)
      
      const updatedPost = {
        ...editingPost,
        tags: editingPostTags,
        meta_keywords: editingPostKeywords
      }
      
      await DataService.updatePost(editingPost.id, updatedPost)
      
      // Reset form
      setEditingPost(null)
      setEditingPostTags([])
      setEditingPostKeywords([])
      setEditTag('')
      setEditKeyword('')
      setIsEditing(false)
      
      // Refresh data
      await fetchData()
      
      // Success toast after operation completes
      addToast({
        type: 'success',
        title: 'Post Updated',
        message: 'Your blog post has been updated successfully'
      })
    } catch (error: any) {
      console.error('Error updating post:', error)
      addToast({
        type: 'error',
        title: 'Failed to Update Post',
        message: error.message || 'An error occurred while updating the post'
      })
      setError(error.message || 'Failed to update post')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    // Toast notification before starting the operation
    addToast({
      type: 'info',
      title: 'Deleting Post',
      message: 'Deleting your blog post...'
    })
    
    // Set loading state
    setIsLoading(true)
    
    // Optimistic update
    const originalPosts = posts
    setPosts(prev => prev.filter(post => post.id !== postId))
    
    try {
      await DataService.deletePost(postId)
      
      // Refresh to ensure consistency
      await fetchData()
      
      // Success toast after operation completes
      addToast({
        type: 'success',
        title: 'Post Deleted',
        message: 'The blog post has been deleted successfully'
      })
    } catch (error: any) {
      console.error('Error deleting post:', error)
      // Revert optimistic update
      setPosts(originalPosts)
      addToast({
        type: 'error',
        title: 'Failed to Delete Post',
        message: error.message || 'An error occurred while deleting the post'
      })
      setError(error.message || 'Failed to delete post')
    } finally {
      setIsLoading(false) // Always reset loading state
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <Header user={user} onSignOut={handleSignOut} />
        
        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Stats Cards */}
          <StatsCards stats={stats} />
          
          {/* Navigation tabs */}
          <Navigation 
            activeSection={activeSection}
            pendingComments={stats.pendingComments}
            isCreating={isCreating}
            onSectionChange={(section) => {
              setActiveSection(section)
              setIsEditing(false)
              setIsCreating(false)
            }}
            onCreateNew={() => {
              setIsCreating(true)
              setIsEditing(false)
            }}
          />
          
          {/* Content area */}
          <div className="space-y-6 backdrop-blur-2xl backdrop-contrast-150 backdrop-brightness-150">
            {isLoading ? (
              <div className="bg-card rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            ) : (
              <>
                {/* Posts Section */}
                {activeSection === 'posts'   && !isEditing && !isCreating && (
                  <PostList 
                    posts={posts}
                    handleEditPost={handleEditPost}
                    handleDeletePost={handleDeletePost}
                  />
                )}
                
                {/* Create Post Form */}
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
                      onCancel={() => !isSaving && setIsCreating(false)}
                    />
                  </div>
                )}
                
                {/* Edit Post Form */}
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
                      onCancel={() => !isSaving && setIsEditing(false)}
                    />
                  </div>
                )}
                
                {/* Comments Section */}
                {activeSection === 'comments' && (
                  <CommentsSection 
                    comments={comments} 
                    onCommentsUpdate={fetchData}
                    addToast={addToast}
                  />
                )}
                
                {/* Analytics Section */}
                {activeSection === 'analytics' && (
                  <AnalyticsPage posts={posts} comments={comments} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
