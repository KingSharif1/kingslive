"use client"

import { useMemo, memo } from "react"
import Link from "next/link"
import { Eye, Heart, TrendingUp, Clock, ExternalLink } from "lucide-react"

interface AnalyticsProps {
  data: {
    totalViews: number
    topPosts: Array<{ title: string, views: number, slug: string }>
    viewsByDay: Array<{ date: string, views: number }>
    engagement: number
  }
}

function AnalyticsDashboard({ data }: AnalyticsProps) {
  // Memoize calculations to prevent unnecessary recalculations
  const totalLikes = useMemo(() =>
    data.topPosts.reduce((acc, post) => acc + (post.views * 0.15), 0),
    [data.topPosts]
  )
  const avgRetention = 64 // percentage

  return (
    <div className="space-y-6">
      {/* Terminal-style header */}
      <div className="flex items-center gap-2 font-mono text-sm">
        <span className="text-slate-500">▸</span>
        <span className="text-[var(--foreground)]">analytics_dashboard</span>
        <span className="text-[var(--muted-foreground)]">--mode=detailed</span>
      </div>

      {/* Quick Stats Grid - removed backdrop-blur */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-[var(--muted-foreground)] uppercase">total_views</span>
            <Eye className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--foreground)]">
            {data.totalViews.toLocaleString()}
          </p>
          <p className="text-xs font-mono text-[var(--muted-foreground)] mt-1">
            <span className="text-slate-500">↑</span> +12.5% this month
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-[var(--muted-foreground)] uppercase">total_likes</span>
            <Heart className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--foreground)]">
            {Math.round(totalLikes).toLocaleString()}
          </p>
          <p className="text-xs font-mono text-[var(--muted-foreground)] mt-1">
            <span className="text-slate-500">↑</span> +8.3% this month
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-[var(--muted-foreground)] uppercase">avg_retention</span>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-[var(--foreground)]">
            {avgRetention}%
          </p>
          <p className="text-xs font-mono text-[var(--muted-foreground)] mt-1">
            <span className="text-slate-500">↑</span> +3.2% this month
          </p>
        </div>
      </div>

      {/* Top Posts - removed backdrop-blur */}
      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-sm text-[var(--foreground)]">
            <span className="text-slate-500">▸</span> top_performing_posts
          </h3>
          <span className="text-xs font-mono text-[var(--muted-foreground)]">
            sorted by views
          </span>
        </div>

        <div className="space-y-3">
          {data.topPosts.length > 0 ? (
            data.topPosts.map((post, i) => {
              const percentage = (post.views / (data.topPosts[0]?.views || 1)) * 100
              const likes = Math.round(post.views * 0.15)

              return (
                <div key={i} className="group p-3 rounded-lg hover:bg-[var(--secondary)] transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[var(--muted-foreground)]">
                          #{i + 1}
                        </span>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-sm font-medium text-[var(--foreground)] hover:text-slate-600 dark:hover:text-slate-400 transition-colors truncate flex items-center gap-1 group/link"
                        >
                          {post.title}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs font-mono text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {likes}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-sm font-mono text-[var(--muted-foreground)]">
                <span className="text-slate-500">!</span> no_data_available
              </p>
              <p className="text-xs font-mono text-[var(--muted-foreground)] mt-1">
                publish posts to see analytics
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Metrics - removed backdrop-blur */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]/80">
          <div className="flex items-center gap-2 mb-4 font-mono text-sm">
            <TrendingUp className="h-4 w-4 text-slate-500" />
            <span className="text-[var(--foreground)]">engagement_rate</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-[var(--muted-foreground)]">view_to_like_ratio</span>
                <span className="text-[var(--foreground)]">15%</span>
              </div>
              <div className="w-full h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-[var(--muted-foreground)]">avg_read_time</span>
                <span className="text-[var(--foreground)]">4.2 min</span>
              </div>
              <div className="w-full h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-[var(--muted-foreground)]">retention_rate</span>
                <span className="text-[var(--foreground)]">{avgRetention}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full" style={{ width: `${avgRetention}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]/80">
          <div className="flex items-center gap-2 mb-4 font-mono text-sm">
            <Eye className="h-4 w-4 text-slate-500" />
            <span className="text-[var(--foreground)]">traffic_sources</span>
          </div>
          <div className="space-y-3">
            {[
              { source: 'direct', percentage: 45 },
              { source: 'social_media', percentage: 30 },
              { source: 'search_engines', percentage: 20 },
              { source: 'referrals', percentage: 5 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-[var(--muted-foreground)]">{item.source}</span>
                  <span className="text-[var(--foreground)]">{item.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-600 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(AnalyticsDashboard)
