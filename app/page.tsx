"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import About from "./components/About"
import Skills from "./components/Skills"
import Portfolio from "./components/Portfolio"
import Footer from "./components/Footer"

// Dynamically import CowrieShell with SSR disabled
const CowrieShell = dynamic(() => import("./components/CowrieShell"), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 w-full h-full z-0 bg-gray-100 opacity-60"></div>
})

export default function Home() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleScroll = () => {
        setScrollY(window.scrollY)
      }

      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <main className="min-h-screen relative">
      <div className="fixed inset-0 w-full h-full z-0 opacity-60">
        {" "}
        {/* Reduced opacity here */}
        <CowrieShell scrollY={scrollY} />
      </div>
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <About />
        <Skills />
        <Portfolio />
        <Footer />
      </div>
    <main className="min-h-screen relative">
      <div className="fixed inset-0 w-full h-full z-0 opacity-60">
        {" "}
        {/* Reduced opacity here */}
        <CowrieShell scrollY={scrollY} />
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
