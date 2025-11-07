"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "./Calendar"
import { TaskList } from "./TaskList"
import { Chat } from "./Chat"
import CtroomContent from "../CtroomContent"
import { AuthService } from "../../services/authService"
import { Activity, BarChart3, TrendingUp, Users, FileText, Eye } from "lucide-react"

interface DashboardProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

export function Dashboard({ addToast }: DashboardProps) {
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get('section')
  const [activeSection, setActiveSection] = useState<string>(sectionParam || 'overview')
  const [stats, setStats] = useState({
    totalPosts: 24,
    publishedPosts: 18,
    totalViews: 12453,
    viewsToday: 342,
    totalComments: 156,
    pendingComments: 8
  })

  useEffect(() => {
    if (sectionParam) {
      setActiveSection(sectionParam)
    }
  }, [sectionParam])

  return (
    <div className="space-y-6">
      {activeSection === 'overview' && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Posts
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPosts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.publishedPosts} published
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Views
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.viewsToday} today
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Comments
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalComments}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingComments} pending approval
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Views Over Time</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px] w-full bg-muted/30 rounded-md flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Chart visualization here</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent blog activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                    <div className="ml-2 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        New comment on "Getting Started with Next.js"
                      </p>
                      <p className="text-xs text-muted-foreground">
                        5 minutes ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="ml-2 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Spike in traffic to "React Hooks Explained"
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div className="ml-2 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        "CSS Grid Layout" is trending on Twitter
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1 day ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <TaskList />
            <Calendar />
          </div>
        </>
      )}

      {activeSection === 'posts' && (
        <Card>
          <CardHeader>
            <CardTitle>Blog Posts</CardTitle>
            <CardDescription>Manage your blog posts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden">
              <CtroomContent addToast={addToast} />
            </div>
            <div id="posts-section">
              {/* We'll extract the posts section from CtroomContent */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">All Posts</h3>
                  <Button onClick={() => window.location.href = '/ctroom?create=true'} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> New Post
                  </Button>
                </div>
                <div className="border rounded-md">
                  <div className="bg-muted/50 p-3 grid grid-cols-12 gap-4 text-sm font-medium">
                    <div className="col-span-5">Title</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-3">Actions</div>
                  </div>
                  <div className="divide-y">
                    {Array.from({length: 5}).map((_, i) => (
                      <div key={i} className="p-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/30">
                        <div className="col-span-5 font-medium">How to Build a Next.js App {i+1}</div>
                        <div className="col-span-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${i % 2 === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                            {i % 2 === 0 ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {new Date(2023, 5, 15 + i).toLocaleDateString()}
                        </div>
                        <div className="col-span-3 flex gap-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20">
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'post-editor' && (
        <Card>
          <CardHeader>
            <CardTitle>MDX Editor</CardTitle>
            <CardDescription>Create and edit posts with rich formatting</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Preview</Button>
                  <Button variant="outline" size="sm">HTML</Button>
                  <Button variant="outline" size="sm">MDX</Button>
                </div>
                <div>
                  <Button size="sm" className="ml-auto">Save</Button>
                </div>
              </div>
              <div className="p-4 min-h-[400px] bg-background">
                <textarea 
                  className="w-full h-full min-h-[400px] p-2 font-mono text-sm bg-transparent border-none focus:outline-none resize-none" 
                  placeholder="# Start writing your MDX content here..."
                  defaultValue="# Getting Started with Next.js

Next.js is a React framework that enables several extra features, including server-side rendering and generating static websites.

## Why Next.js?

- **Server-side rendering**
- **Static site generation**
- **API Routes**
- **File-based routing**

```jsx
// Example Next.js component
export default function Home() {
  return <h1>Hello, Next.js!</h1>
}
```

> Next.js provides a great developer experience with all the features you need for production.

![Next.js](https://nextjs.org/static/images/nextjs-logo.png)"

                ></textarea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'comments' && (
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>Manage comments on your blog posts</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="pending">Pending ({stats.pendingComments})</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="spam">Spam</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="space-y-4">
                {Array.from({length: 3}).map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">John Doe</p>
                        <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(2023, 5, 20 - i).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm mb-3">This is a great article! I've been looking for a clear explanation of this topic for a while now. Thanks for sharing your knowledge.</p>
                    <p className="text-xs text-muted-foreground mb-3">On: <span className="font-medium">Getting Started with Next.js</span></p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Approve</Button>
                      <Button size="sm" variant="outline" className="text-red-500">Delete</Button>
                    </div>
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="approved">
                <p className="text-sm text-muted-foreground">Showing approved comments...</p>
              </TabsContent>
              <TabsContent value="spam">
                <p className="text-sm text-muted-foreground">Showing spam comments...</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {activeSection === 'analytics' && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>View your blog performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Views Today</h3>
                  <div className="text-2xl font-bold">{stats.viewsToday}</div>
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
                    {Array.from({length: 5}).map((_, i) => (
                      <div key={i} className="p-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/30">
                        <div className="col-span-6 font-medium">How to Build a Next.js App {i+1}</div>
                        <div className="col-span-2">{1250 - (i * 200)}</div>
                        <div className="col-span-2">{24 - (i * 4)}</div>
                        <div className="col-span-2">2:{45 - (i * 10)}min</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'calendar' && (
        <Calendar />
      )}

      {activeSection === 'tasks' && (
        <TaskList />
      )}

      {activeSection === 'chat' && (
        <Chat />
      )}

      {activeSection === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Manage your account settings and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Settings panel coming soon...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
