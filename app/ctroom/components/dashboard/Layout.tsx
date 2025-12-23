"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Store sidebar state in localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(newState))
    }
  }

  // Check if mobile on mount and load sidebar state
  useEffect(() => {
    setIsMounted(true)
    
    // Load sidebar state from localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        setIsCollapsed(savedState === 'true')
      }
    }
    
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
      
      // Only auto-collapse on small screens if no saved preference
      if (window.innerWidth < 1024 && localStorage.getItem('sidebarCollapsed') === null) {
        setIsCollapsed(true)
      }
    }
    
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile sidebar */}
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden fixed left-4 top-4 z-40"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar />
          </SheetContent>
        </Sheet>
      ) : (
        <aside
          className={cn(
            "fixed inset-y-0 z-30 hidden md:flex flex-col border-r transition-all duration-300",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          <div className="flex h-14 items-center justify-between px-4 border-b">
            {!isCollapsed && (
              <span className="font-semibold text-lg">Ctroom</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={toggleSidebar}
            >
              {isCollapsed ? (
                <Menu className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isCollapsed ? "Expand" : "Collapse"}
              </span>
            </Button>
          </div>
          <div className="flex-1 h-[calc(100vh-3.5rem)] overflow-hidden">
            <Sidebar isCollapsed={isCollapsed} />
          </div>
        </aside>
      )}

      {/* Main content */}
      <main
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          isMobile ? "ml-0" : isCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <TopNav />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
