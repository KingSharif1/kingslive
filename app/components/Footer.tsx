'use client'

import { motion } from "framer-motion"
import { Github, Linkedin, Mail } from "lucide-react"
import { GraduationCountdown } from "./GraduationCountdown"
import { AnimatedSignature } from "./AnimatedSignature"

export default function Footer() {
  const socialLinks = [
    { icon: <Github className="w-5 h-5" />, href: "https://github.com/KingSharif1" },
    { icon: <Linkedin className="w-5 h-5" />, href: "https://linkedin.com/in/king-sharif/" },
    { icon: <Mail className="w-5 h-5" />, href: "/contact" },
  ]

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center space-y-8">
          {/* Graduation Countdown */}
          <GraduationCountdown />
          
          {/* Desktop: Name and Description */}
          <div className="hidden md:block text-center max-w-2xl">

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Full Stack Developer passionate about creating innovative solutions and pushing the boundaries of web technology.
            </p>
          </div>
          
          {/* Animated Signature - Centered */}
          <div className="w-full max-w-md mx-auto">
            <AnimatedSignature />
          </div>

          {/* Connect with me - Centered */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Connect with me</h3>
            <div className="flex justify-center space-x-8">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>
          </div>
          
          {/* Copyright */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8"
          >
            <p>{new Date().getFullYear()} King Sharif. All rights reserved.</p>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  )
}
