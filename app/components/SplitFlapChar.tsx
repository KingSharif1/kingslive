'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface SplitFlapCharProps {
  value: string
  className?: string
  playSound?: boolean
}

export function SplitFlapChar({ value, className, playSound = true }: SplitFlapCharProps) {
  const [isFlipping, setIsFlipping] = useState(false)
  const [displayValue, setDisplayValue] = useState(value)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/tick.mp3')
      audioRef.current.volume = 0.15 // Lower volume
    }
  }, [])

  useEffect(() => {
    if (value !== displayValue) {
      setIsFlipping(true)
      if (playSound && audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {})
      }
      
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setIsFlipping(false)
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [value, displayValue, playSound])

  return (
    <div 
      className={cn(
        "relative w-[40px] h-[60px] sm:w-[52px] sm:h-[78px] md:w-[64px] md:h-[96px] bg-[#111111] rounded-lg overflow-hidden",
        "shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]",
        "border border-white/[0.03]",
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/20 pointer-events-none" />
      
      {/* Character display */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center font-mono font-bold",
          "text-[40px] sm:text-[52px] md:text-[64px]",
          "transition-transform duration-200 ease-in-out transform-gpu",
          "text-white/90",
          isFlipping && "animate-flip"
        )}
        style={{ 
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: '0 2px 4px rgba(0,0,0,0.4)'
        }}
      >
        {displayValue}
      </div>

      {/* Highlight effect */}
      <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/[0.07] to-transparent pointer-events-none" />

      {/* Border lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
    </div>
  )
}
