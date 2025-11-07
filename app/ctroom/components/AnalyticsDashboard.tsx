"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AnalyticsProps {
  data: {
    totalViews: number
    topPosts: Array<{ title: string, views: number }>
    viewsByDay: Array<{ date: string, views: number }>
    engagement: number
  }
}

export default function AnalyticsDashboard({ data }: AnalyticsProps) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-medium">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time page views</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.engagement}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average time on page</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium truncate">
              {data.topPosts[0]?.title || "No data"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.topPosts[0]?.views.toLocaleString() || 0} views
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.viewsByDay[data.viewsByDay.length - 1]?.views || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.viewsByDay.length > 1 
                ? `${Math.round(((data.viewsByDay[data.viewsByDay.length - 1]?.views || 0) / 
                   (data.viewsByDay[data.viewsByDay.length - 2]?.views || 1) - 1) * 100)}% from yesterday` 
                : 'No previous data'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPosts.length > 0 ? (
                data.topPosts.map((post, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{post.title}</p>
                      <p className="text-sm text-muted-foreground">{post.views.toLocaleString()} views</p>
                    </div>
                    <div className={`w-16 h-2 rounded-full bg-primary/20`}>
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ 
                          width: `${(post.views / (data.topPosts[0]?.views || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-end justify-between">
            {data.viewsByDay.length > 0 ? (
              data.viewsByDay.slice(-7).map((day, i) => {
                const maxViews = Math.max(...data.viewsByDay.slice(-7).map(d => d.views))
                const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0
                
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-12 bg-primary/20 rounded-t-md relative">
                      <div 
                        className="absolute bottom-0 w-full bg-primary rounded-t-md"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
