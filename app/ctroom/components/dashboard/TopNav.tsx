"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, User, CheckSquare, Lightbulb, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { AuthService } from "../../services/authService"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { MessageSquare } from "lucide-react"
import { BarChart3 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Notification {
  id: string
  type: 'comment' | 'task' | 'idea'
  title: string
  description: string
  time: string
  read: boolean
  link?: string
}

export function TopNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<{id: string, email: string, username?: string, isAdmin: boolean} | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch real notifications
  const fetchNotifications = async () => {
    try {
      const notifs: Notification[] = []
      
      // Get pending comments
      const { data: comments } = await supabase
        .from('blog_comments')
        .select('id, author_name, content, created_at, post_id')
        .eq('approved', false)
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .limit(5)

      if (comments) {
        comments.forEach(comment => {
          notifs.push({
            id: `comment-${comment.id}`,
            type: 'comment',
            title: `New comment from ${comment.author_name}`,
            description: comment.content.substring(0, 60) + (comment.content.length > 60 ? '...' : ''),
            time: getRelativeTime(comment.created_at),
            read: false,
            link: '/ctroom?section=blog'
          })
        })
      }

      // Get tasks due today or overdue
      const today = new Date().toISOString().split('T')[0]
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, due_date, priority')
        .eq('completed', false)
        .lte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(3)

      if (tasks) {
        tasks.forEach(task => {
          const isOverdue = task.due_date < today
          notifs.push({
            id: `task-${task.id}`,
            type: 'task',
            title: isOverdue ? `Overdue: ${task.title}` : `Due today: ${task.title}`,
            description: `Priority: ${task.priority}`,
            time: isOverdue ? 'Overdue' : 'Today',
            read: false,
            link: '/ctroom?section=tasks'
          })
        })
      }

      setNotifications(notifs)
      setUnreadCount(notifs.length)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user } = await AuthService.getCurrentUser()
        setUser(user)
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }
    fetchUser()
    fetchNotifications()
    
    // Refresh notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    try {
      await AuthService.signOut()
      // No need to redirect here, the signOut method will handle it
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <div className="hidden md:flex">
          <Link href="/ctroom" className="font-semibold text-lg">
            Ctroom Dashboard
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">{unreadCount} new</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                  <p className="text-xs">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <Link 
                    key={notif.id} 
                    href={notif.link || '#'}
                    className={`block p-3 hover:bg-muted/50 cursor-pointer ${index < notifications.length - 1 ? 'border-b' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative mt-1">
                        {!notif.read && (
                          <span className="flex h-2 w-2 absolute -top-1 -right-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                          </span>
                        )}
                        {notif.type === 'comment' && <MessageSquare className="h-8 w-8 text-blue-500" />}
                        {notif.type === 'task' && <CheckSquare className="h-8 w-8 text-orange-500" />}
                        {notif.type === 'idea' && <Lightbulb className="h-8 w-8 text-yellow-500" />}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                        <p className="text-xs text-muted-foreground">{notif.time}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-muted-foreground"
                    onClick={() => setUnreadCount(0)}
                  >
                    Mark all as read
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <ModeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.email || "My Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/ctroom?section=profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/ctroom?section=settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500" onClick={handleSignOut}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
