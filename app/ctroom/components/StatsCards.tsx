"use client"

import { TrendingUp, MessageSquare, Eye, Star, FileText, CheckCircle } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalPosts: number
    publishedPosts: number
    totalComments: number
    pendingComments: number
    totalViews: number
    featuredPosts: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Posts",
      value: stats.totalPosts,
      subtitle: `${stats.publishedPosts} published`,
      icon: FileText,
      color: "bg-blue-500",
      lightBg: "bg-slate-200",
      darkBg: "dark:bg-slate-700"
    },
    {
      title: "Comments",
      value: stats.totalComments,
      subtitle: stats.pendingComments > 0 ? `${stats.pendingComments} pending` : "All approved",
      icon: MessageSquare,
      color: "bg-green-500",
      lightBg: "bg-slate-200",
      darkBg: "dark:bg-slate-700"
    },
    {
      title: "Total Views",
      value: stats.totalViews.toLocaleString(),
      subtitle: "Across all posts",
      icon: Eye,
      color: "bg-purple-500",
      lightBg: "bg-slate-200",
      darkBg: "dark:bg-slate-700"
    },
    {
      title: "Featured",
      value: stats.featuredPosts,
      subtitle: "Featured posts",
      icon: Star,
      color: "bg-yellow-500",
      lightBg: "bg-slate-200",
      darkBg: "dark:bg-slate-700"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className={`${card.lightBg} ${card.darkBg} ring-1 ring-slate-500/50 dark:ring-slate-100/50 rounded-xl backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150 p-6 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-xl`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
