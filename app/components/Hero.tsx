"use client"

import { motion } from "framer-motion"
import { ArrowRight, Download } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useTypewriter, Cursor } from 'react-simple-typewriter'

export default function Hero() {
  const [text] = useTypewriter({
    words: [
      'Full Stack Developer',
      'Software Engineer',
      'UI/UX Designer',
      'Problem Solver'
    ],
    loop: true,
    delaySpeed: 2000,
  })

  const handleDownloadCV = () => {
    toast("Still Working On It", {
      description: "I'm almost finished :)",
      duration: 3000,
    })
  }

  return (
    <section className="bg-transparent min-h-screen pt-16 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 pt-8 lg:pt-16"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full filter blur-3xl opacity-70"></div>
            <div className="relative">
              <span className="text-xl light-mode-text dark:text-white glow-text">Hello,</span>
              <h1 className="text-5xl sm:text-6xl font-bold mt-2 mb-4 light-mode-text dark:text-white glow-text">
                I&apos;m King Sharif
              </h1>
              <h2 className="text-3xl sm:text-4xl font-semibold light-mode-text dark:text-white mb-6 glow-text flex items-center">
                a <span className="text-black dark:text-white ml-2">{text}</span>
                <Cursor cursorColor="#3B82F6" />
              </h2>
              <p className="text-lg light-mode-text dark:text-white max-w-2xl mb-8">
                <span className="font-semibold">Amor Fati</span> is a latin phrase which means &quot;Love of fate&quot;.
                A Stoic never complains about fate and accepts whatever fate throws his way. He only focuses on what he
                controls and tries to make the best possible decisions.
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleDownloadCV}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white dark:bg-white dark:text-black rounded-full font-medium hover:bg-blue-800 dark:hover:bg-gray-100"
                  >
                    Download CV
                    <Download className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-6 py-3 border-2 border-blue-900 text-blue-900 dark:border-white dark:text-white rounded-full font-medium hover:bg-blue-50 dark:hover:bg-gray-900"
                  >
                    <Link href="/contact"> Contact me</Link>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 mt-12 lg:mt-0"
        >
          <div className="relative w-full max-w-lg mx-auto">
            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            <div className="relative">
              <Image
                src="/p1.PNG"
                alt="King Sharif"
                width={500}
                height={600}
                className="relative rounded-2xl shadow-2xl hover-lift"
                priority
              />
            </div>
          </div>
        </motion.div>
      </div>
      <div className="absolute inset-0 bg-cool-gradient opacity-50"></div>
    </section>
  )
}
