"use client"

import { motion } from "framer-motion"

interface GrandChronicleLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export default function GrandChronicLeLogo({ 
  size = "md", 
  showText = true, 
  className = "" 
}: GrandChronicleLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  }
  
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Compass Rose Logo */}
      <motion.div 
        className={`relative ${sizeClasses[size]} flex-shrink-0`}
        whileHover={{ rotate: 15 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer compass ring */}
        <div className="absolute inset-0 rounded-full border-2 border-gradient-to-r from-blue-500 to-purple-600 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"></div>
        
        {/* Crown at top */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
          <div className="w-3 h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-t-xl"></div>
          <div className="w-4 h-1 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-b-xl -mt-0.5 -ml-0.5"></div>
        </div>
        
        {/* Compass points */}
        <div className="absolute inset-2 flex items-center justify-center">
          <div className="relative w-full h-full">
            {/* North point */}
            <div className="absolute top-0 left-1/2 w-0 h-0 border-l-2 border-r-2 border-b-3 border-l-transparent border-r-transparent border-b-blue-600 transform -translate-x-1/2"></div>
            {/* South point */}
            <div className="absolute bottom-0 left-1/2 w-0 h-0 border-l-2 border-r-2 border-t-3 border-l-transparent border-r-transparent border-t-purple-600 transform -translate-x-1/2"></div>
            {/* East point */}
            <div className="absolute right-0 top-1/2 w-0 h-0 border-t-2 border-b-2 border-l-3 border-t-transparent border-b-transparent border-l-indigo-600 transform -translate-y-1/2"></div>
            {/* West point */}
            <div className="absolute left-0 top-1/2 w-0 h-0 border-t-2 border-b-2 border-r-3 border-t-transparent border-b-transparent border-r-blue-500 transform -translate-y-1/2"></div>
            
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
        
        {/* Scroll accent */}
        <div className="absolute -bottom-1 -right-1 w-2 h-3 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-900 rounded-xl border border-amber-300 dark:border-amber-700"></div>
      </motion.div>
      
      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <motion.h1 
            className={`${textSizes[size]} font-black leading-none bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            The Grand
          </motion.h1>
          <motion.span 
            className={`${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-2xl'} font-bold text-gray-600 dark:text-gray-300 -mt-1`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Chronicle
          </motion.span>
        </div>
      )}
    </div>
  )
}
