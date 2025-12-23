"use client"

import React, { useState, useEffect } from "react"
import { BarChart, TrendingUp, Users, Eye, MessageSquare, Calendar, Clock, Star } from "lucide-react"
import { BlogPost, Comment, PostAnalytics } from "../types"
import { DataService } from "../services/dataService"

interface AnalyticsPageProps {
  posts: BlogPost[]
  comments: Comment[]
}

interface AnalyticsData {
  totalViews: number
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalComments: number
  approvedComments: number
  pendingComments: number
  featuredPosts: number
  avgViewsPerPost: number
  postsThisMonth: number
  commentsThisMonth: number
  topPosts: Array<{ title: string; views: number; slug: string }>
  recentActivity: Array<{ type: string; title: string; date: string }>
}

export default function AnalyticsPage({ posts, comments }: AnalyticsPageProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [postAnalytics, setPostAnalytics] = useState<PostAnalytics[]>([])

  useEffect(() => {
    fetchPostAnalytics()
  }, [])
  
  useEffect(() => {
    calculateAnalytics()
  }, [posts, comments, timeRange, postAnalytics])
  
  const fetchPostAnalytics = async () => {
    try {
      const analytics = await DataService.fetchPostAnalytics()
      setPostAnalytics(analytics)
    } catch (error) {
      console.error('Error fetching post analytics:', error)
      setPostAnalytics([])
    }
  }

  const calculateAnalytics = () => {
    if (!posts || !comments) return

    const now = new Date()
    const timeRanges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'all': Infinity
    }

    const cutoffDate = timeRange === 'all' ? new Date(0) : new Date(now.getTime() - timeRanges[timeRange])

    // Filter data by time range - only use actual database records
    const filteredPosts = posts.filter(post => {
      if (!post.created_at) return false
      const postDate = new Date(post.created_at)
      return timeRange === 'all' || postDate >= cutoffDate
    })

    const filteredComments = comments.filter(comment => {
      if (!comment.created_at) return false
      const commentDate = new Date(comment.created_at)
      return timeRange === 'all' || commentDate >= cutoffDate
    })

    // Calculate real metrics from database
    // Get view counts from the analytics table instead of the posts table
    const totalViews = postAnalytics.reduce((sum, analytic) => sum + (analytic.view_count || 0), 0)
    const publishedPosts = posts.filter(post => post.published === true).length
    const draftPosts = posts.filter(post => post.published === false).length
    const approvedComments = comments.filter(comment => comment.approved === true).length
    const pendingComments = comments.filter(comment => comment.approved === false).length
    const featuredPosts = posts.filter(post => post.featured === true).length

    // Top posts by actual views from analytics table
    const topPosts = posts
      .filter(post => post.published === true)
      .map(post => {
        const analytics = postAnalytics.find(a => a.post_id === post.id)
        return {
          id: post.id,
          title: post.title || 'Untitled',
          views: analytics?.view_count || 0,
          slug: post.slug || ''
        }
      })
      .filter(post => post.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // Recent activity from actual database records
    const postActivities = posts
      .filter(post => post.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 5)
      .map(post => ({
        type: 'post' as const,
        title: `${post.published ? 'Published' : 'Created draft'}: ${post.title || 'Untitled'}`,
        date: post.created_at!
      }))

    const commentActivities = comments
      .filter(comment => comment.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 5)
      .map(comment => ({
        type: 'comment' as const,
        title: `${comment.approved ? 'Approved comment' : 'New comment'} from ${comment.author || 'Anonymous'}`,
        date: comment.created_at!
      }))

    const recentActivity = [...postActivities, ...commentActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)

    const analyticsData: AnalyticsData = {
      totalViews,
      totalPosts: posts.length,
      publishedPosts,
      draftPosts,
      totalComments: comments.length,
      approvedComments,
      pendingComments,
      featuredPosts,
      avgViewsPerPost: publishedPosts > 0 ? Math.round(totalViews / publishedPosts) : 0,
      postsThisMonth: filteredPosts.length,
      commentsThisMonth: filteredComments.length,
      topPosts,
      recentActivity
    }

    setAnalytics(analyticsData)
  }

  if (!analytics) {
    return (
      <div className="bg-slate-200 dark:bg-slate-900 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-300 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="bg-slate-200 dark:bg-slate-900 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart className="h-6 w-6" />
              Analytics Dashboard
            </h2>
            <p className="text-muted-foreground mt-1">Track your blog's performance and engagement</p>
          </div>
          
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-slate-300 dark:bg-slate-700 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Views"
          value={analytics.totalViews.toLocaleString()}
          icon={Eye}
          color="blue"
        />
        <MetricCard
          title="Published Posts"
          value={analytics.publishedPosts.toString()}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Total Comments"
          value={analytics.totalComments.toString()}
          icon={MessageSquare}
          color="purple"
        />
        <MetricCard
          title="Featured Posts"
          value={analytics.featuredPosts.toString()}
          icon={Star}
          color="yellow"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Overview */}
        <div className="bg-slate-200 dark:bg-slate-900 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Content Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Published Posts</span>
              <span className="font-medium text-foreground">{analytics.publishedPosts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Draft Posts</span>
              <span className="font-medium text-foreground">{analytics.draftPosts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Average Views per Post</span>
              <span className="font-medium text-foreground">{analytics.avgViewsPerPost}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Featured Posts</span>
              <span className="font-medium text-foreground">{analytics.featuredPosts}</span>
            </div>
          </div>
        </div>

        {/* Comment Stats */}
        <div className="bg-slate-200 dark:bg-slate-900 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Comment Activity</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Approved Comments</span>
              <span className="font-medium text-green-600">{analytics.approvedComments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pending Comments</span>
              <span className="font-medium text-yellow-600">{analytics.pendingComments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Comments</span>
              <span className="font-medium text-foreground">{analytics.totalComments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Approval Rate</span>
              <span className="font-medium text-foreground">
                {analytics.totalComments > 0 
                  ? Math.round((analytics.approvedComments / analytics.totalComments) * 100)
                  : 0
                }%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Posts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posts */}
        <div className="bg-slate-200 dark:bg-slate-900 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Posts by Views</h3>
          <div className="space-y-3">
            {analytics.topPosts.length > 0 ? (
              analytics.topPosts.map((post, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-300 dark:bg-slate-800 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{post.title}</p>
                    <p className="text-sm text-muted-foreground">{post.views} views</p>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No published posts yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-200 dark:bg-slate-900 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-300 dark:bg-slate-800 rounded-xl">
                  <div className={`p-1.5 rounded-full ${
                    activity.type === 'post' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                  }`}>
                    {activity.type === 'post' ? (
                      <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <MessageSquare className="h-3 w-3 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'purple' | 'yellow'
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
  }

  return (
    <div className="bg-slate-200 dark:bg-slate-900 backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
