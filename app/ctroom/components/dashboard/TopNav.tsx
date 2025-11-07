"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, User } from "lucide-react"
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

export function TopNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<{id: string, email: string, username?: string, isAdmin: boolean} | null>(null)

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
  }, [])

  const handleSignOut = async () => {
    try {
      await AuthService.signOut()
      window.location.href = '/ctroom'
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
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-600" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-auto">
              <div className="p-3 border-b hover:bg-muted/50 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="relative mt-1">
                    <span className="flex h-2 w-2 absolute -top-1 -right-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">New comment on "Getting Started with Next.js"</p>
                    <p className="text-xs text-muted-foreground">John Doe: This is a great article! I've been looking...</p>
                    <p className="text-xs text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>
              </div>
              <div className="p-3 border-b hover:bg-muted/50 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <BarChart3 className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Traffic spike on "React Hooks Explained"</p>
                    <p className="text-xs text-muted-foreground">Your post is getting 43% more views today</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="p-3 hover:bg-muted/50 cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <User className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">New subscriber</p>
                    <p className="text-xs text-muted-foreground">Someone@example.com subscribed to your blog</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                View all notifications
              </Button>
            </div>
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
