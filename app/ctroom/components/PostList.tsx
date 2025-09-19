"use client"

import { motion } from "framer-motion"
import { Edit, Trash2, Eye, MessageCircle } from "lucide-react"
import Link from "next/link"
import { BlogPost, PostAnalytics } from "../types"
import { useState, useEffect } from "react"
import { DataService } from "../services/dataService"

interface PostListProps {
  posts: BlogPost[]
  handleEditPost: (post: BlogPost) => void
  handleDeletePost: (postId: string) => void
}

interface PostWithAnalytics extends BlogPost {
  analytics?: PostAnalytics
}

export default function PostList({ posts, handleEditPost, handleDeletePost }: PostListProps) {
  const [postsWithAnalytics, setPostsWithAnalytics] = useState<PostWithAnalytics[]>(posts)
  const [loading, setLoading] = useState(false)

  // Fetch analytics data for all posts
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (posts.length === 0) return
      
      setLoading(true)
      try {
        const analyticsPromises = posts.map(async (post) => {
          try {
            const analytics = await DataService.getPostAnalytics(post.id)
            return { ...post, analytics: analytics || undefined }
          } catch (error) {
            // If no analytics found, return post without analytics
            return { ...post, analytics: undefined }
          }
        })
        
        const results = await Promise.all(analyticsPromises)
        setPostsWithAnalytics(results)
      } catch (error) {
        console.error('Error fetching analytics:', error)
        setPostsWithAnalytics(posts)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [posts])
  return (
    <div className="bg-gray-300 dark:bg-gray-800 shadow rounded-xl overflow-hidden backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Blog Posts
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Manage the blog content
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Views
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Comments
              </th>
              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-300 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {postsWithAnalytics.map((post) => (
              <motion.tr 
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{post.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{post.slug}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    post.published 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {loading ? '...' : (post.analytics?.view_count || 0)}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {loading ? '...' : (post.analytics?.comment || 0)}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <Link 
                      href={post.published ? `/blog/${post.slug}` : `/blog/${post.slug}?preview=true`}
                      target="_blank"
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      title={post.published ? "View Post" : "Preview Draft"}
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
