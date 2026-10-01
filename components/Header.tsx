"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Menu } from "lucide-react"
import { ThemeTransition } from "./ThemeTransition"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavItem = {
  label: string
  href: string
  homeOnly: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: "Projects", href: "#projects", homeOnly: true },
  { label: "Blog", href: "/blog", homeOnly: false },
  { label: "Contact", href: "#connect", homeOnly: true },
]

function visibleItems(isHome: boolean) {
  return NAV_ITEMS.filter((item) => !item.homeOnly || isHome)
}

function NavItemControl({
  item,
  isHome,
  className,
  onNavigate,
}: {
  item: NavItem
  isHome: boolean
  className: string
  onNavigate?: () => void
}) {
  const isScrollLink = item.href.startsWith("#")

  if (isScrollLink && isHome) {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.()
          document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: "smooth" })
        }}
        className={className}
      >
        {item.label}
      </button>
    )
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {item.label}
    </Link>
  )
}

export function Header({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const items = visibleItems(isHome)
  const desktopLinkClass = `px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-full hover:bg-accent ${isScrolled ? "text-xs" : "text-sm"}`

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "py-3" : "py-0"}`}
    >
      <div
        className={`transition-all duration-500 ${
          isScrolled
            ? "max-w-3xl mx-auto px-4 backdrop-blur-xl bg-background/70 border border-border/50 rounded-xl shadow-lg"
            : "max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 bg-transparent border-b border-transparent"
        }`}
      >
        <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? "h-12" : "h-20"}`}>
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity duration-300"
          >
            <div className={`relative transition-all duration-300 rounded-full overflow-hidden ${isScrolled ? "w-8 h-8" : "w-10 h-10"}`}>
              <Image
                src="/favicon.ico"
                alt="Logo"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
              {items.map((item) => (
                <NavItemControl
                  key={item.label}
                  item={item}
                  isHome={isHome}
                  className={desktopLinkClass}
                />
              ))}
            </nav>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle className="text-left font-outfit font-light">Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Jump to a section of the site
                  </SheetDescription>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile">
                  {items.map((item) => (
                    <NavItemControl
                      key={item.label}
                      item={item}
                      isHome={isHome}
                      onNavigate={() => setMenuOpen(false)}
                      className="px-3 py-3 text-base text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors text-left"
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <div className="h-5 w-px bg-neutral-300/40 dark:bg-neutral-700/50 mx-1" />
            <ThemeTransition isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </div>
    </header>
  )
}
