"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Moon, Sun, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const [isDark, setIsDark] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/#about" },
    { name: "Skills", href: "/#skills" },
    { name: "Portfolio", href: "/#portfolio" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <div className="fixed w-full top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="max-w-7xl mx-auto bg-gradient-to-b from-blue-100/80 to-blue-200/80 dark:from-blue-900/80 dark:to-blue-800/80 rounded-full shadow-lg overflow-hidden backdrop-blur-sm"
      >
        <div className="flex justify-between items-center px-6 py-3">
          <Link href="/" className="flex items-center space-x-2">
            <motion.span
              className="text-2xl font-bold text-blue-800 dark:text-blue-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              King Sharif
            </motion.span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <motion.span
                  className={`cursor-pointer text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100 transition-colors ${
                    pathname === item.href ? "font-semibold" : ""
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.name}
                </motion.span>
              </Link>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full bg-blue-200 dark:bg-blue-700 hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-800" />}
            </motion.button>
          </div>

          <div className="md:hidden">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-blue-700 dark:text-blue-200">
                  <Menu className="h-6 w-6" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[200px] p-2 mr-4 bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg rounded-xl border-none shadow-2xl"
                align="end"
              >
                <motion.nav 
                  className="flex flex-col space-y-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05,
                      },
                    },
                  }}
                >
                  {navItems.map((item) => (
                    <motion.div
                      key={item.name}
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { 
                          opacity: 1, 
                          x: 0,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 24,
                          }
                        },
                      }}
                    >
                      <Link 
                        href={item.href} 
                        onClick={() => setIsOpen(false)}
                      >
                        <motion.span
                          className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pathname === item.href
                              ? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
                              : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          }`}
                        >
                          {item.name}
                        </motion.span>
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      visible: { 
                        opacity: 1, 
                        x: 0,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 24,
                        }
                      },
                    }}
                    className="pt-2 border-t border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDark(!isDark)}
                        className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      >
                        {isDark ? (
                          <Sun className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <Moon className="h-5 w-5 text-blue-800 dark:text-blue-200" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </motion.nav>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </motion.nav>
    </div>
  )
}
