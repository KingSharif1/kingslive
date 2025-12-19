"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStats, useAllPosts } from "../../hooks/useQueries"
import { BarChart3 } from "lucide-react"

interface AnalyticsSectionProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

export function AnalyticsSection({ addToast }: AnalyticsSectionProps) {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: allPosts, isLoading: allPostsLoading } = useAllPosts()
 
  
  // Mock analytics data - in a real app, this would come from the API
  const analyticsData: AnalyticsData = {
    totalViews: stats?.totalViews || 0,
    viewsToday: stats?.viewsToday || 0,
    viewsThisWeek: stats?.viewsThisWeek || 0,
    viewsThisMonth: stats?.viewsThisMonth || 0,
    topPosts: allPosts?.slice(0, 5).map(post => ({
      title: post.title,
      views: post.views || 0,
      slug: post.slug
    })) || [],
    viewsOverTime: [
      { date: '2023-01', views: 120 },
      { date: '2023-02', views: 240 },
      { date: '2023-03', views: 180 },
      { date: '2023-04', views: 350 },
      { date: '2023-05', views: 280 },
      { date: '2023-06', views: 420 },
    ],
    viewsByDay: [
      { date: '2023-06-01', views: 42 },
      { date: '2023-06-02', views: 36 },
      { date: '2023-06-03', views: 51 },
      { date: '2023-06-04', views: 28 },
      { date: '2023-06-05', views: 39 },
    ],
    engagement: 0.64
  }
  
  const isLoading = statsLoading || allPostsLoading
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>View your blog performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Views Today</h3>
                <div className="text-2xl font-bold">{analyticsData.viewsToday}</div>
                <p className="text-xs text-green-500 mt-1">↑ 12% from yesterday</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg. Time on Page</h3>
                <div className="text-2xl font-bold">3:24</div>
                <p className="text-xs text-red-500 mt-1">↓ 5% from last week</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Engagement Rate</h3>
                <div className="text-2xl font-bold">64%</div>
                <p className="text-xs text-green-500 mt-1">↑ 8% from last month</p>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Traffic Overview</h3>
              <div className="h-[300px] bg-muted/30 rounded-md flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Traffic chart visualization</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Top Posts</h3>
              <div className="border rounded-md">
                <div className="bg-muted/50 p-3 grid grid-cols-12 gap-4 text-sm font-medium">
                  <div className="col-span-6">Post</div>
                  <div className="col-span-2">Views</div>
                  <div className="col-span-2">Comments</div>
                  <div className="col-span-2">Avg. Time</div>
                </div>
                <div className="divide-y">
                  {analyticsData.topPosts?.map((post, i) => (
                    <div key={i} className="p-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/30">
                      <div className="col-span-6 font-medium">{post.title}</div>
                      <div className="col-span-2">{post.views}</div>
                      <div className="col-span-2">{Math.floor(Math.random() * 30)}</div>
                      <div className="col-span-2">2:{Math.floor(Math.random() * 60)}min</div>
                    </div>
                  )) || (
                    <div className="p-4 text-center text-muted-foreground">
                      No posts data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
