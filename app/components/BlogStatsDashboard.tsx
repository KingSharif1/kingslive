"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BarChart, LineChart, PieChart, RefreshCw } from "lucide-react"

interface BlogStats {
  totalPosts: number
  publishedPosts: number
  totalViews: number
  popularPosts: {
    id: string
    title: string
    slug: string
    views: number
  }[]
}

export default function BlogStatsDashboard() {
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchStats = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/blog/stats")
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error: any) {
      console.error("Failed to fetch blog stats:", error)
      setError("Failed to load statistics. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="text-red-500 flex items-center justify-between">
          <p>{error}</p>
          <button 
            onClick={fetchStats}
            className="flex items-center text-blue-500 hover:text-blue-600"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold light-mode-text dark:text-white">Blog Analytics</h2>
        <button 
          onClick={fetchStats}
          className="flex items-center text-blue-500 hover:text-blue-600"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-500 dark:text-blue-400">Total Posts</p>
              <h3 className="text-2xl font-bold light-mode-text dark:text-white">{stats?.totalPosts || 0}</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
              <BarChart className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-500 dark:text-green-400">Published</p>
              <h3 className="text-2xl font-bold light-mode-text dark:text-white">{stats?.publishedPosts || 0}</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
              <LineChart className="w-5 h-5 text-green-500 dark:text-green-400" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-500 dark:text-purple-400">Total Views</p>
              <h3 className="text-2xl font-bold light-mode-text dark:text-white">{stats?.totalViews || 0}</h3>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
              <PieChart className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3 light-mode-text dark:text-white">Popular Posts</h3>
        <div className="space-y-3">
          {stats?.popularPosts && stats.popularPosts.length > 0 ? (
            stats.popularPosts.map(post => (
              <div key={post.id} className="flex items-center justify-between">
                <a 
                  href={`/blog/${post.slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:underline light-mode-text dark:text-gray-300 truncate max-w-[70%]"
                >
                  {post.title}
                </a>
                <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                  {post.views} views
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No popular posts yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
