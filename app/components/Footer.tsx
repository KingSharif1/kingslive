'use client'

import { motion } from "framer-motion"
import { Github, Linkedin, Mail } from "lucide-react"
import { GraduationCountdown } from "./GraduationCountdown"

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center space-y-12">
          {/* Graduation Countdown */}
          <GraduationCountdown />
          
          <div className="flex flex-col md:flex-row justify-between items-center w-full space-y-8 md:space-y-0">
            <div className="text-center md:text-left">
              <motion.h3 
                whileHover={{ scale: 1.05 }}
                className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-4"
              >
                King Sharif
              </motion.h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                Full Stack Developer passionate about creating innovative solutions and pushing the boundaries of web technology.
              </p>
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-200">Connect with me</h3>
              <div className="flex space-x-6">
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
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center text-gray-600 dark:text-gray-400"
          >
            <p> {new Date().getFullYear()} King Sharif. All rights reserved.</p>
          </motion.div>
        </div>
      </div>
    </motion.footer>
  )
}
