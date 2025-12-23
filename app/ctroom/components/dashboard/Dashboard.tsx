"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskList } from "./TaskList"
import { Chat } from "./Chat"
import { Users, FileText, MessageSquare, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

// Import section components
import { BlogSection } from "./BlogSection"
import { IdeasSection } from "./IdeasSection"
import { SettingsSection } from "./SettingsSection"
import { CalendarView } from "./CalendarView"

// Import React Query hooks
import { useStats } from "../../hooks/useQueries"

interface DashboardProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

export function Dashboard({ addToast }: DashboardProps) {
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get('section')
  const [activeSection, setActiveSection] = useState<string>(sectionParam || 'overview')
  
  useEffect(() => {
    const newSection = searchParams.get('section') || 'overview'
    setActiveSection(newSection)
  }, [searchParams])
  
  const { data: stats } = useStats()

  return (
    <div className="space-y-4">
      {activeSection === 'overview' && (
        <>
          {/* Quick Stats Row */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Posts</p>
                    <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Published</p>
                    <p className="text-2xl font-bold">{stats?.publishedPosts || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Comments</p>
                    <p className="text-2xl font-bold">{stats?.totalComments || 0}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{stats?.pendingComments || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => window.open('/studio/structure/post', '_blank')}>
                <FileText className="h-4 w-4 mr-2" />
                New Post
                <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.location.href = '/ctroom?section=blog'}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Manage Blog
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open('/studio', '_blank')}>
                Sanity Studio
                <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
              </Button>
            </CardContent>
          </Card>

          {/* Tasks */}
          <TaskList />
        </>
      )}

      {activeSection === 'blog' && (
        <BlogSection addToast={addToast} />
      )}

      {activeSection === 'tasks' && (
        <CalendarView />
      )}

      {activeSection === 'ideas' && (
        <IdeasSection addToast={addToast} />
      )}

      {activeSection === 'chat' && (
        <Chat />
      )}

      {activeSection === 'settings' && (
        <SettingsSection addToast={addToast} />
      )}
    </div>
  )
}
