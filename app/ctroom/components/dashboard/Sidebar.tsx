"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const currentSection = searchParams.get('section') || 'overview'

  // Function to check if a section is active
  const isActive = (section: string) => {
    if (section === 'overview') {
      return !searchParams.get('section') && pathname === '/ctroom'
    }
    return currentSection === section
  }

  const handleSignOut = async () => {
    try {
      await AuthService.signOut()
      // No need to redirect here, the signOut method will handle it
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/ctroom",
      variant: isActive("overview") ? "default" : "ghost",
    },
    {
      title: "Posts",
      icon: <FileEdit className="h-5 w-5" />,
      href: "/ctroom?section=posts",
      variant: isActive("posts") ? "default" : "ghost",
    },
    {
      title: "Comments",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/ctroom?section=comments",
      variant: isActive("comments") ? "default" : "ghost",
    },
    {
      title: "Tasks",
      icon: <CheckSquare className="h-5 w-5" />,
      href: "/ctroom?section=tasks",
      variant: isActive("tasks") ? "default" : "ghost",
    },
    {
      title: "Assistant",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/ctroom?section=chat",
      variant: isActive("chat") ? "default" : "ghost",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/ctroom?section=settings",
      variant: isActive("settings") ? "default" : "ghost",
    },
  ]

  return (
    <div className="flex h-full w-full flex-col p-2" style={{height: '100%', display: 'flex'}}>
      {/* Navigation items */}
      <div className="flex-1 flex flex-col gap-2 py-2 overflow-y-auto" style={{minHeight: 0}}>
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
      
      {/* Logout button - fixed at bottom */}
      <div className="mt-4 pt-4 border-t">
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
