"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, RefreshCw, Eye } from "lucide-react"
import { getAllPosts } from "@/lib/sanity-queries"

interface SanityPost {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
}

interface PostsSectionProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

export function PostsSection({ addToast }: PostsSectionProps) {
  const [posts, setPosts] = useState<SanityPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const data = await getAllPosts()
      setPosts(data || [])
    } catch (err) {
      console.error('Error fetching posts:', err)
      setPosts([]) // Show empty state instead of stuck loading
      addToast({ type: 'error', title: 'Error', message: 'Failed to fetch posts from Sanity' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Blog Posts</CardTitle>
            <CardDescription>Manage your Sanity blog posts</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={fetchPosts} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button size="sm" onClick={() => window.open('/studio/structure/post', '_blank')}>
              <FileText className="h-4 w-4 mr-2" />
              New Post
              <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No posts found. Create your first post in Sanity Studio!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div 
                key={post._id} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-medium truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    }) : 'Draft'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    post.publishedAt 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {post.publishedAt ? 'Published' : 'Draft'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/blog/${post.slug.current}`, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`https://kingslive.sanity.studio/structure/post;${post._id}`, '_blank')}
                  >
                    Edit
                    <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
