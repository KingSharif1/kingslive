"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import About from "./components/About"
import Skills from "./components/Skills"
import Portfolio from "./components/Portfolio"
import Footer from "./components/Footer"

// Dynamically import CowrieShell with no SSR and lazy loading
const CowrieShell = dynamic(() => import("./components/CowrieShell"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 w-full h-full z-0 bg-gray-100 opacity-60"></div>
})

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const requestRef = useRef<number | null>(null)
  
  // Smooth scroll handler using requestAnimationFrame
  const smoothScrollHandler = () => {
    setScrollY(window.scrollY)
    requestRef.current = requestAnimationFrame(smoothScrollHandler)
  }

  useEffect(() => {
    // Only run on client
    setIsMounted(true)
    
    // Start the animation frame loop for smooth scrolling
    requestRef.current = requestAnimationFrame(smoothScrollHandler)
    
    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  return (
    <main className="min-h-screen relative">
      <div className="fixed inset-0 w-full h-full z-0 opacity-60">
        {isMounted && <CowrieShell scrollY={scrollY} />}
      </div>
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <About />
        <Skills />
        <Portfolio />
        <Footer />
      </div>
    </main>
  )
}
