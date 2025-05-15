'use client'

import { motion } from "framer-motion"
import { Github, Linkedin, Mail } from "lucide-react"
import { GraduationCountdown } from "./GraduationCountdown"
import AnimatedCursiveName from "./AnimatedCursiveName"

export default function Footer() {
  const socialLinks = [
    { icon: <Github className="w-4 h-4" />, href: "https://github.com/KingSharif1" },
    { icon: <Linkedin className="w-4 h-4" />, href: "https://linkedin.com/in/king-sharif/" },
    { icon: <Mail className="w-4 h-4" />, href: "/contact" },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/95 dark:bg-black/95 shadow-sm text-gray-700 dark:text-gray-300"
    >
      <div className="max-w-4xl mx-auto flex  flex-wrap gap-3 justify-center items-center px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6">
          {/* Animated Cursive Name */}
          <div className="md:basis-1/3 text-left flex items-center justify-center md:justify-start">
            <AnimatedCursiveName />
          </div>
          {/* Summary */}
          <div className="md:basis-1/3 text-center text-sm text-gray-600 dark:text-gray-400">
            Full Stack Developer passionate about creative solutions and pushing the boundaries of web technology.
          </div>
          {/* Socials and Copyright */}
          <div className="md:basis-1/3 flex justify-end md:justify-start gap-2">
            <div className="flex gap-4">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.icon}
                </motion.a>
              ))}
            </div>

          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} King Sharif. All rights reserved.
        </div>
      </div>
    </motion.footer>
  );
}
