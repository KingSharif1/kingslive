"use client"

import { memo } from "react"
import { TrendingUp, Eye, Heart, Clock } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalPosts: number
    publishedPosts: number
    totalViews: number
    featuredPosts: number
    avgRetention?: number
  }
}

function StatsCards({ stats }: StatsCardsProps) {
  // Calculate total likes (placeholder - would come from DB)
  const totalLikes = stats.totalPosts * 12 // Mock data

  const cards = [
    {
      title: "total_views",
      value: stats.totalViews.toLocaleString(),
      subtitle: "across_all_posts",
      icon: Eye,
      gradient: "from-slate-600 to-slate-500",
    },
    {
      title: "total_likes",
      value: totalLikes.toLocaleString(),
      subtitle: "engagement_count",
      icon: Heart,
      gradient: "from-slate-600 to-slate-500",
    },
    {
      title: "avg_retention",
      value: `${stats.avgRetention || 64}%`,
      subtitle: "reader_retention",
      icon: Clock,
      gradient: "from-slate-600 to-slate-500",
    },
    {
      title: "growth_rate",
      value: "+12.5%",
      subtitle: "this_month",
      icon: TrendingUp,
      gradient: "from-slate-600 to-slate-500",
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="relative group"
          >
            {/* Subtle border on hover */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-xl opacity-0 group-hover:opacity-50 blur-sm transition-opacity duration-500" />

            {/* Card content - removed backdrop-blur and simplified hover */}
            <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 transition-all duration-300 hover:border-slate-600">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs font-mono text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold font-mono text-[var(--foreground)]">
                    {card.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${card.gradient} shadow-sm`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-xs font-mono text-[var(--muted-foreground)]">
                <span className="text-slate-500">▸</span> {card.subtitle}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export default memo(StatsCards)
