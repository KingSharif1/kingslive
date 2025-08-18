"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Edit, Trash2, Plus, Save, X, Eye, BarChart, MessageSquare, Star, Check, Mail } from "lucide-react"
import Link from "next/link"
import { supabase, BlogPost as SupabaseBlogPost } from "@/lib/supabase"
import { signIn, signOut, getCurrentUser, subscribeToAuthChanges, signInWithMagicLink } from "@/lib/auth"

interface Category {
  id: string
  name: string
  slug: string
  description: string
}

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  created_at: string
  updated_at: string
  author: string
  slug: string
  tags: string[]
  published: boolean
  views: number
  cover_image?: string
  category_id?: string
  featured: boolean
  meta_description?: string
  meta_keywords?: string[]
}

interface Comment {
  id: string
  post_id: string
  author_name: string
  author_email: string
  content: string
  created_at: string
  approved: boolean
  post_title?: string
}

interface PostAnalytics {
  post_id: string
  views: number
  unique_visitors: number
  avg_time_on_page: number
  bounce_rate: number
  post_title?: string
}

// Sample blog posts for initial display (will be replaced by Supabase data)
const SAMPLE_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "Building a Portfolio with Next.js and TypeScript",
    excerpt: "Learn how I built this portfolio website using Next.js, TypeScript, and Tailwind CSS with a retro macOS aesthetic.",
    content: "# Building a Portfolio with Next.js and TypeScript\n\nCreating a modern portfolio website is essential for showcasing your skills...",
    created_at: "2025-08-10T12:00:00Z",
    updated_at: "2025-08-10T12:00:00Z",
    author: "King Sharif",
    slug: "building-portfolio-nextjs-typescript",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    published: true,
    views: 120,
    cover_image: "/blog-covers/portfolio.jpg",
    category_id: "11111111-1111-1111-1111-111111111111",
    featured: true,
    meta_description: "A detailed guide on building a portfolio website with Next.js and TypeScript",
    meta_keywords: ["portfolio", "web development", "Next.js"]
  },
  {
    id: "2",
    title: "Integrating AI Assistants with Hugging Face",
    excerpt: "How to add an AI assistant to your website using Hugging Face's inference API and Next.js API routes.",
    content: "# Integrating AI Assistants with Hugging Face\n\nAdding an AI assistant to your website can enhance user experience...",
    created_at: "2025-08-05T10:30:00Z",
    updated_at: "2025-08-05T10:30:00Z",
    author: "King Sharif",
    slug: "integrating-ai-assistants-huggingface",
    tags: ["AI", "Hugging Face", "Next.js"],
    published: true,
    views: 85,
    category_id: "33333333-3333-3333-3333-333333333333",
    featured: false,
    meta_description: "Learn how to integrate Hugging Face AI models into your Next.js application",
    meta_keywords: ["AI", "machine learning", "chatbot"]
  },
  {
    id: "3",
    title: "Creating Animated UI Components with Framer Motion",
    excerpt: "A deep dive into creating smooth, interactive UI components using Framer Motion in React applications.",
    content: "# Creating Animated UI Components with Framer Motion\n\nAdding animations to your React components can significantly improve user experience...",
    created_at: "2025-07-28T15:45:00Z",
    updated_at: "2025-07-28T15:45:00Z",
    author: "King Sharif",
    slug: "animated-ui-components-framer-motion",
    tags: ["Framer Motion", "React", "Animation"],
    published: true,
    views: 42,
    category_id: "22222222-2222-2222-2222-222222222222",
    featured: false,
    meta_description: "Learn how to create beautiful animations with Framer Motion in React",
    meta_keywords: ["animation", "UI", "UX"]
  }
]

export default function CtroomPage() {
  const [posts, setPosts] = useState<BlogPost[]>(SAMPLE_POSTS)
  const [categories, setCategories] = useState<Category[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [analytics, setAnalytics] = useState<PostAnalytics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [authError, setAuthError] = useState("")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [user, setUser] = useState<{id: string, email: string, username?: string, isAdmin: boolean} | null>(null)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isCreating, setIsCreating] = useState(false)
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
  const [newTag, setNewTag] = useState("")
  const [newKeyword, setNewKeyword] = useState("")
  const [editTag, setEditTag] = useState("")
  const [editKeyword, setEditKeyword] = useState("")
  const [newPostTags, setNewPostTags] = useState<string[]>([])
  const [editPostTags, setEditPostTags] = useState<string[]>([])
  const [newPostKeywords, setNewPostKeywords] = useState<string[]>([])
  const [editPostKeywords, setEditPostKeywords] = useState<string[]>([])
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostExcerpt, setNewPostExcerpt] = useState('')
  const [newPostCategory, setNewPostCategory] = useState('')
  const [newPostPublished, setNewPostPublished] = useState(false)
  const [newPostFeatured, setNewPostFeatured] = useState(false)
  const [newPostMetaDescription, setNewPostMetaDescription] = useState('')
  const [editPostId, setEditPostId] = useState('')
  const [editPostTitle, setEditPostTitle] = useState('')
  const [editPostContent, setEditPostContent] = useState('')
  const [editPostExcerpt, setEditPostExcerpt] = useState('')
  const [editPostSlug, setEditPostSlug] = useState('')
  const [editPostCategory, setEditPostCategory] = useState('')
  const [editPostPublished, setEditPostPublished] = useState(false)
  const [editPostFeatured, setEditPostFeatured] = useState(false)
  const [editPostMetaDescription, setEditPostMetaDescription] = useState('')
  const [activeTab, setActiveTab] = useState("content") // content, seo, settings
  type SectionType = string
  const [activeSection, setActiveSection] = useState<SectionType>('posts')
  const [error, setError] = useState("")

  // Fetch blog data from Supabase

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        setIsAuthenticated(!!user && user.isAdmin)
        if (user && user.isAdmin) {
          setUser(user)
          // Debug check to verify admin_users table
          console.log('Checking admin_users table on component mount...')
          const { data: adminUsers, error } = await supabase
            .from('admin_users')
            .select('*')
          console.log('Admin users found:', adminUsers, error)
          
          // Fetch blog data if authenticated
          await fetchData()
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      }
    }
    
    checkAuth()
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
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
      }
    )
    
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch data when authenticated
      fetchData()
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    try {
      // Fetch blog posts
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (postsError) throw postsError
      if (postsData) setPosts(postsData)
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
      
      if (categoriesError) throw categoriesError
      if (categoriesData) setCategories(categoriesData)
      
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (commentsError) throw commentsError
      if (commentsData) setComments(commentsData)
      
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    console.log('Login attempt with email:', email)
    
    try {
      if (!email) {
        setAuthError('Please enter your email address')
        return
      }
      
      // First check if the email is in admin_users table BEFORE attempting any auth
      console.log('Checking if email is in admin_users table...')
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
      
      console.log('Admin check response:', adminUsers, adminError)
      
      if (adminError) {
        console.error('Admin check error:', adminError)
        setAuthError('Error checking admin status: ' + adminError.message)
        return
      }
      
      // If not an admin email, show error and stop here - don't send magic link
      if (!adminUsers || adminUsers.length === 0) {
        console.log('Not an admin email')
        setAuthError('Access denied: This email is not authorized for admin access')
        return
      }
      
      console.log('Admin user found:', adminUsers[0])
      
      // Only send magic link if the email is in the admin_users table
      console.log('Admin email verified, sending magic link...')
      await signInWithMagicLink(email)
      console.log('Magic link sent successfully')
      setMagicLinkSent(true)
      
      // Authentication state will be updated by the subscription
    } catch (error: any) {
      console.error('Login error:', error)
      setAuthError(error.message || 'Failed to sign in')
    }
  }
  
  const handleSignOut = async () => {
    try {
      await signOut()
      // Auth state will be updated by the subscription
      window.location.href = '/ctroom' // Redirect to login page after logout
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }
  
  // Tag management functions
  const handleRemoveTag = (tagToRemove: string, isNewPost: boolean) => {
    if (isNewPost) {
      setNewPostTags(newPostTags.filter(tag => tag !== tagToRemove))
    } else {
      setEditPostTags(editPostTags.filter(tag => tag !== tagToRemove))
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
      if (!editPostTags.includes(tagToAdd)) {
        setEditPostTags([...editPostTags, tagToAdd])
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
      if (!editPostKeywords.includes(keywordToAdd)) {
        setEditPostKeywords([...editPostKeywords, keywordToAdd])
      }
      setEditKeyword('')
    }
  }
  
  // Post management functions
  const handleCreateNewPost = async () => {
    try {
      if (!newPostTitle || !newPostContent) {
        setError('Title and content are required')
        return
      }
      
      const slug = newPostTitle
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')
      
      const newPost = {
        title: newPostTitle,
        content: newPostContent,
        excerpt: newPostExcerpt || newPostContent.substring(0, 150) + '...',
        slug,
        published: newPostPublished,
        author: user?.email || 'Admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: newPostTags,
        meta_keywords: newPostKeywords,
        meta_description: newPostMetaDescription,
        category_id: newPostCategory,
        featured: newPostFeatured,
        views: 0
      }
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([newPost])
      
      if (error) throw error
      
      // Reset form
      setNewPostTitle('')
      setNewPostContent('')
      setNewPostExcerpt('')
      setNewPostTags([])
      setNewPostCategory('')
      setNewPostPublished(false)
      setNewPostFeatured(false)
      setNewPostMetaDescription('')
      setNewPostKeywords([])
      
      // Refresh posts list
      fetchData()
      
      // Show success message
      setActiveSection('posts')
    } catch (error: any) {
      console.error('Error creating post:', error)
      setError(error.message || 'Failed to create post')
    }
  }
  
  const handleEditPost = (post: BlogPost) => {
    setEditPostId(post.id)
    setEditPostTitle(post.title)
    setEditPostContent(post.content)
    setEditPostExcerpt(post.excerpt || '')
    setEditPostSlug(post.slug)
    setEditPostTags(post.tags || [])
    setEditPostCategory(post.category_id || '')
    setEditPostPublished(post.published)
    setEditPostFeatured(post.featured || false)
    setEditPostMetaDescription(post.meta_description || '')
    setEditPostKeywords(post.meta_keywords || [])
    setActiveSection('edit-post')
  }
  
  const handleSavePost = async () => {
    try {
      if (!editPostTitle || !editPostContent) {
        setError('Title and content are required')
        return
      }
      
      const updatedPost = {
        title: editPostTitle,
        content: editPostContent,
        excerpt: editPostExcerpt,
        slug: editPostSlug,
        published: editPostPublished,
        updated_at: new Date().toISOString(),
        tags: editPostTags,
        meta_keywords: editPostKeywords,
        meta_description: editPostMetaDescription,
        category_id: editPostCategory,
        featured: editPostFeatured
      }
      
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updatedPost)
        .eq('id', editPostId)
      
      if (error) throw error
      
      // Refresh posts list
      fetchData()
      
      // Return to posts list
      setActiveSection('posts')
    } catch (error: any) {
      console.error('Error updating post:', error)
      setError(error.message || 'Failed to update post')
    }
  }
  
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)
      
      if (error) throw error
      
      // Refresh posts list
      fetchData()
    } catch (error: any) {
      console.error('Error deleting post:', error)
      setError(error.message || 'Failed to delete post')
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="py-20 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2 light-mode-text dark:text-white">Control Room</h1>
              <p className="text-gray-500 dark:text-gray-400">Admin access only</p>
            </div>
            
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                <Mail className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Handshake Login</span>
              </div>
            </div>
            
            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p>{authError}</p>
                </div>
              </motion.div>
            )}
            
            {magicLinkSent && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>Secret handshake initiated! Check your email to complete login.</p>
                </div>
              </motion.div>
            )}
            
            {!magicLinkSent && (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                
                
                <div className="w-full flex justify-center">
                  <>
                  <button
                    type="submit"
                    className="w-fit border-2 rounded-xl flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    
                      <Mail className="mr-2 h-4 w-4 " />
                      Secret Handshake
                    
                  </button>
                  </>
                </div>
              </form>
            )}
            
            {magicLinkSent && (
              <div className="text-center py-6">
                <svg className="mx-auto h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Secret Handshake Initiated</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">We've sent a secure link to your email address. Click the link to complete the handshake.</p>
                <button
                  onClick={() => setMagicLinkSent(false)}
                  className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Try again with a different email
                </button>
              </div>
            )}
            
            <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              This area is restricted to authorized administrators only.
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold light-mode-text dark:text-white">Control Room</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your blog content</p>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
          
          {/* Dashboard Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Blog Posts</h3>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 8l-7 7-3-3m0 0l-1 5 5-1m0 0l7-7m0 0l-1-1h-5m12 1v7" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{posts.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {posts.filter(post => post.published).length} published, {posts.filter(post => !post.published).length} drafts
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Comments</h3>
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{comments.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {comments.filter(comment => comment.approved).length} approved, {comments.filter(comment => !comment.approved).length} pending
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Categories</h3>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-md">
                  <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{categories.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Used to organize content
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Views</h3>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-md">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {posts.reduce((total, post) => total + (post.views || 0), 0)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Across all blog posts
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveSection('posts')}
              className={`py-3 px-6 font-medium whitespace-nowrap ${activeSection === 'posts' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <div className="flex items-center">
                <Edit className="w-4 h-4 mr-2" />
                Blog Posts
              </div>
            </button>
            <button
              onClick={() => setActiveSection('comments')}
              className={`py-3 px-6 font-medium whitespace-nowrap ${activeSection === 'comments' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <div className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Comments
              </div>
            </button>
            <button
              onClick={() => setActiveSection('analytics')}
              className={`py-3 px-6 font-medium whitespace-nowrap ${activeSection === 'analytics' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <div className="flex items-center">
                <BarChart className="w-4 h-4 mr-2" />
                Analytics
              </div>
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          ) : (
            <>
              {/* Blog Posts Section */}
              {activeSection === 'posts' && (
                <>
                  {isCreating ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold light-mode-text dark:text-white">Create New Post</h2>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button
                      onClick={() => setActiveTab('content')}
                      className={`py-2 px-4 font-medium ${activeTab === 'content' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      Content
                    </button>
                    <button
                      onClick={() => setActiveTab('seo')}
                      className={`py-2 px-4 font-medium ${activeTab === 'seo' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      SEO
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`py-2 px-4 font-medium ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      Settings
                    </button>
                  </div>
                  
                  {/* Content Tab */}
                  {activeTab === 'content' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={newPost.title}
                          onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Excerpt
                        </label>
                        <textarea
                          value={newPost.excerpt}
                          onChange={(e) => setNewPost({...newPost, excerpt: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Content (Markdown supported)
                        </label>
                        <textarea
                          value={newPost.content}
                          onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                          rows={10}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Author
                        </label>
                        <input
                          type="text"
                          value={newPost.author}
                          onChange={(e) => setNewPost({...newPost, author: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {newPost.tags?.map(tag => (
                            <div key={tag} className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                              <span className="text-gray-700 dark:text-gray-300 text-sm">{tag}</span>
                              <button
                                onClick={() => handleRemoveTag(tag, true)}
                                className="ml-2 text-gray-500 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a tag"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag(true)}
                          />
                          <button
                            onClick={() => handleAddTag(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* SEO Tab */}
                  {activeTab === 'seo' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Meta Description
                        </label>
                        <textarea
                          value={newPost.meta_description || ''}
                          onChange={(e) => setNewPost({...newPost, meta_description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          rows={2}
                          placeholder="Brief description for search engines (150-160 characters)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Meta Keywords
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {newPost.meta_keywords?.map(keyword => (
                            <div key={keyword} className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                              <span className="text-gray-700 dark:text-gray-300 text-sm">{keyword}</span>
                              <button
                                onClick={() => {
                                  setNewPost({
                                    ...newPost,
                                    meta_keywords: (newPost.meta_keywords || []).filter(k => k !== keyword)
                                  })
                                }}
                                className="ml-2 text-gray-500 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex">
                          <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Add a keyword"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword(true)}
                          />
                          <button
                            onClick={() => handleAddKeyword(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Category
                        </label>
                        <select
                          value={newPost.category_id || ''}
                          onChange={(e) => setNewPost({...newPost, category_id: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="featured-new"
                          checked={newPost.featured || false}
                          onChange={(e) => setNewPost({...newPost, featured: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="featured-new" className="ml-2 block text-gray-700 dark:text-gray-300">
                          Featured Post
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="published-new"
                          checked={newPost.published || false}
                          onChange={(e) => setNewPost({...newPost, published: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="published-new" className="ml-2 block text-gray-700 dark:text-gray-300">
                          Published
                        </label>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handleCreateNewPost}
                      className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Create Post
                    </button>
                  </div>
                </div>
              ) : editingPost ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold light-mode-text dark:text-white">Edit Post</h2>
                    <button
                      onClick={() => setEditingPost(null)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button
                      onClick={() => setActiveTab('content')}
                      className={`py-2 px-4 font-medium ${activeTab === 'content' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      Content
                    </button>
                    <button
                      onClick={() => setActiveTab('seo')}
                      className={`py-2 px-4 font-medium ${activeTab === 'seo' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      SEO
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`py-2 px-4 font-medium ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      Settings
                    </button>
                  </div>
                  
                  {/* Content Tab */}
                  {activeTab === 'content' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editingPost.title}
                          onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Excerpt
                        </label>
                        <textarea
                          value={editingPost.excerpt}
                          onChange={(e) => setEditingPost({...editingPost, excerpt: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Content (Markdown supported)
                        </label>
                        <textarea
                          value={editingPost.content}
                          onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                          rows={10}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Author
                        </label>
                        <input
                          type="text"
                          value={editingPost.author}
                          onChange={(e) => setEditingPost({...editingPost, author: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {editingPost.tags.map(tag => (
                            <div key={tag} className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                              <span className="text-gray-700 dark:text-gray-300 text-sm">{tag}</span>
                              <button
                                onClick={() => handleRemoveTag(tag, false)}
                                className="ml-2 text-gray-500 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Add a tag"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag(false)}
                          />
                          <button
                            onClick={() => handleAddTag(false)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* SEO Tab */}
                  {activeTab === 'seo' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Meta Description
                        </label>
                        <textarea
                          value={editingPost.meta_description || ''}
                          onChange={(e) => setEditingPost({...editingPost, meta_description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          rows={2}
                          placeholder="Brief description for search engines (150-160 characters)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Meta Keywords
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(editingPost.meta_keywords || []).map(keyword => (
                            <div key={keyword} className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                              <span className="text-gray-700 dark:text-gray-300 text-sm">{keyword}</span>
                              <button
                                onClick={() => {
                                  setEditingPost({
                                    ...editingPost,
                                    meta_keywords: (editingPost.meta_keywords || []).filter(k => k !== keyword)
                                  })
                                }}
                                className="ml-2 text-gray-500 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex">
                          <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Add a keyword"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword(false)}
                          />
                          <button
                            onClick={() => handleAddKeyword(false)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-md transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Settings Tab */}
                  {activeTab === 'settings' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                          Category
                        </label>
                        <select
                          value={editingPost.category_id || ''}
                          onChange={(e) => setEditingPost({...editingPost, category_id: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="featured-edit"
                          checked={editingPost.featured || false}
                          onChange={(e) => setEditingPost({...editingPost, featured: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="featured-edit" className="ml-2 block text-gray-700 dark:text-gray-300">
                          Featured Post
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="published-edit"
                          checked={editingPost.published}
                          onChange={(e) => setEditingPost({...editingPost, published: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="published-edit" className="ml-2 block text-gray-700 dark:text-gray-300">
                          Published
                        </label>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end pt-6">
                    <button
                      onClick={handleSavePost}
                      className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map(post => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold light-mode-text dark:text-white">{post.title}</h3>
                            {post.featured && (
                              <span className="flex items-center bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 rounded text-xs text-yellow-800 dark:text-yellow-200">
                                <Star className="w-3 h-3 mr-1" fill="currentColor" />
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{post.excerpt}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map(tag => (
                              <span 
                                key={tag} 
                                className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs text-gray-700 dark:text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 gap-3">
                            <span>By {post.author}</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              <span>{post.views}</span>
                            </div>
                            {post.category_id && categories.find(c => c.id === post.category_id) && (
                              <span className="flex items-center bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-xs text-blue-800 dark:text-blue-200">
                                {categories.find(c => c.id === post.category_id)?.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <button className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400" title="View post">
                              <Eye className="w-5 h-5" />
                            </button>
                          </Link>
                          <button 
                            onClick={() => handleEditPost(post)}
                            className="p-2 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400"
                            title="Edit post"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                            title="View analytics"
                          >
                            <BarChart className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                            title="Delete post"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
                </>
              )}
              
              {/* Comments Section */}
              {(activeSection as SectionType) === 'comments' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                  <h2 className="text-xl font-bold light-mode-text dark:text-white mb-6">Comment Moderation</h2>
                  
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No comments to moderate
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map(comment => (
                        <div 
                          key={comment.id}
                          className={`border-l-4 ${comment.approved ? 'border-green-500' : 'border-yellow-500'} bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 dark:text-white">{comment.author_name}</h3>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{comment.author_email}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                On post: <span className="font-medium">{comment.post_title}</span>
                              </p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-3">{comment.content}</p>
                          
                          <div className="flex justify-end space-x-2">
                            {!comment.approved && (
                              <button
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('blog_comments')
                                      .update({ approved: true })
                                      .eq('id', comment.id);
                                      
                                    if (error) throw error;
                                    
                                    // Update local state
                                    setComments(comments.map(c => 
                                      c.id === comment.id ? { ...c, approved: true } : c
                                    ));
                                  } catch (error) {
                                    console.error('Error approving comment:', error);
                                    setError('Failed to approve comment');
                                  }
                                }}
                                className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this comment?")) {
                                  try {
                                    const { error } = await supabase
                                      .from('blog_comments')
                                      .delete()
                                      .eq('id', comment.id);
                                      
                                    if (error) throw error;
                                    
                                    // Update local state
                                    setComments(comments.filter(c => c.id !== comment.id));
                                  } catch (error) {
                                    console.error('Error deleting comment:', error);
                                    setError('Failed to delete comment');
                                  }
                                }
                              }}
                              className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Analytics Section */}
              {(activeSection as SectionType) === 'analytics' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                  <h2 className="text-xl font-bold light-mode-text dark:text-white mb-6">Blog Analytics</h2>
                  
                  {analytics.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No analytics data available
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Post</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Views</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unique Visitors</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Avg. Time on Page</th>
                            <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bounce Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {analytics.map(item => (
                            <tr key={item.post_id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.post_title}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.views}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.unique_visitors}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.avg_time_on_page.toFixed(2)}s</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{(item.bounce_rate * 100).toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </motion.div>
      </div>
    </section>
  )
}
