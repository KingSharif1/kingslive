"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface BountyPosterProps {
  author: string
  avatar?: string
  bounty?: string
  className?: string
}

export default function BountyPoster({ 
  author, 
  avatar = "/pfp/dark.png", 
  bounty = "1,000,000", 
  className = "" 
}: BountyPosterProps) {
  return (
    <motion.div
      className={`bounty-poster p-6 max-w-sm ${className}`}
      whileHover={{ scale: 1.02, rotate: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Wanted Header */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 uppercase tracking-wider" style={{fontFamily: 'serif'}}>
          WANTED
        </h3>
        <div className="w-full h-1 bg-amber-800 dark:bg-amber-200 my-2"></div>
      </div>
      
      {/* Author Photo */}
      <div className="relative mb-4">
        <div className="w-32 h-32 mx-auto border-4 border-amber-800 dark:border-amber-200 rounded-lg overflow-hidden bg-amber-100 dark:bg-amber-900">
          <Image
            src={avatar}
            alt={author}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Vintage stamp */}
        <div className="vintage-stamp absolute -top-2 -right-2 px-2 py-1 text-xs font-bold">
          AUTHOR
        </div>
      </div>
      
      {/* Author Name */}
      <div className="text-center mb-4">
        <h4 className="text-xl font-black text-amber-900 dark:text-amber-100 uppercase" style={{fontFamily: 'serif'}}>
          {author}
        </h4>
        <p className="text-sm text-amber-700 dark:text-amber-300 italic">
          "Special Correspondent"
        </p>
      </div>
      
      {/* Bounty Amount */}
      <div className="text-center border-t-2 border-amber-800 dark:border-amber-200 pt-4">
        <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold">
          ARTICLES PUBLISHED
        </p>
        <p className="text-2xl font-black text-amber-900 dark:text-amber-100" style={{fontFamily: 'serif'}}>
          {bounty}
        </p>
      </div>
      
      {/* Bottom text */}
      <div className="text-center mt-4 text-xs text-amber-600 dark:text-amber-400">
        <p>DEAD OR ALIVE</p>
        <p className="italic">By order of The Grand Chronicle</p>
      </div>
    </motion.div>
  )
}
