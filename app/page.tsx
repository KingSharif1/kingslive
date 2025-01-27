"use client"

import { useEffect, useState } from "react"
import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import About from "./components/About"
import Skills from "./components/Skills"
import Portfolio from "./components/Portfolio"
import Footer from "./components/Footer"
import CowrieShell from "./components/CowrieShell"

export default function Home() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
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
    </main>
  )
}

