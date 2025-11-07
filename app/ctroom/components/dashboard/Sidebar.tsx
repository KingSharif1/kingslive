"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  FileEdit,
  MessageSquare,
  BarChart3,
  CalendarDays,
  CheckSquare,
  Settings,
  User,
  LogOut,
} from "lucide-react"
import { AuthService } from "../../services/authService"

interface SidebarProps {
  isCollapsed?: boolean
}

interface SidebarItem {
  title: string
  icon: React.ReactNode
  href: string
  variant: "default" | "ghost"
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<{id: string, email: string, username?: string, isAdmin: boolean} | null>(null)

  const handleSignOut = async () => {
    try {
      await AuthService.signOut()
      window.location.href = '/ctroom'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/ctroom",
      variant: pathname === "/ctroom" ? "default" : "ghost",
    },
    {
      title: "Posts",
      icon: <FileEdit className="h-5 w-5" />,
      href: "/ctroom?section=posts",
      variant: pathname.includes("posts") ? "default" : "ghost",
    },
    {
      title: "MDX Editor",
      icon: <FileEdit className="h-5 w-5" />,
      href: "/ctroom?section=post-editor",
      variant: pathname.includes("post-editor") ? "default" : "ghost",
    },
    {
      title: "Comments",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/ctroom?section=comments",
      variant: pathname.includes("comments") ? "default" : "ghost",
    },
    {
      title: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/ctroom?section=analytics",
      variant: pathname.includes("analytics") ? "default" : "ghost",
    },
    {
      title: "Calendar",
      icon: <CalendarDays className="h-5 w-5" />,
      href: "/ctroom?section=calendar",
      variant: pathname.includes("calendar") ? "default" : "ghost",
    },
    {
      title: "Tasks",
      icon: <CheckSquare className="h-5 w-5" />,
      href: "/ctroom?section=tasks",
      variant: pathname.includes("tasks") ? "default" : "ghost",
    },
    {
      title: "Chat",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/ctroom?section=chat",
      variant: pathname.includes("chat") ? "default" : "ghost",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/ctroom?section=settings",
      variant: pathname.includes("settings") ? "default" : "ghost",
    },
  ]

  return (
    <div className="flex h-full w-full flex-col gap-2 p-2">
      <div className="flex flex-col gap-2 py-2">
        {sidebarItems.map((item, index) => (
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant={item.variant}
                  size="icon"
                  className="h-10 w-10"
                  asChild
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span className="sr-only">{item.title}</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="border-none bg-primary text-primary-foreground">
                {item.title}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              key={index}
              variant={item.variant}
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href={item.href}>
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </Link>
            </Button>
          )
        ))}
      </div>
      <div className="mt-auto">
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Log out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="border-none bg-primary text-primary-foreground">
              Log out
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-2">Log out</span>
          </Button>
        )}
      </div>
    </div>
  )
}
