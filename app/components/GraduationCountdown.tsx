'use client'

import { useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { SplitFlapChar } from './SplitFlapChar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Play, Pause } from 'lucide-react'

// Set your graduation date here (10:00 AM Central Time - Texas)
const GRADUATION_DATE = new Date('2025-05-10T10:00:00-05:00')

export function GraduationCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: '000',
    hours: '00',
    minutes: '00',
    seconds: '00'
  })
  const [isReversed, setIsReversed] = useState(false)
  const [hasCelebrated, setHasCelebrated] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showTimer, setShowTimer] = useState(true)
  const [userInteracted, setUserInteracted] = useState(false)
  const [isGraduationTime, setIsGraduationTime] = useState(false)
  const countdownRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<HTMLDivElement>(null)
  const soundRef = useRef<Howl | null>(null)
  const tickAudioRef = useRef<HTMLAudioElement | null>(null)
  const tickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const celebrationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Pre-load audio file but don't play yet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Just fetch and store the audio data
      fetch('/sounds/celebration.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          // Store the raw array buffer for later use
          const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          return tempContext.decodeAudioData(arrayBuffer)
        })
        .then(decodedBuffer => {
          // Not needed anymore
        })
        .catch(error => console.log("Audio loading failed:", error))
    }
  }, [])

  // Initialize Howler sound
  useEffect(() => {
    soundRef.current = new Howl({
      src: ['/sounds/celebration.mp3'],
      loop: true,
      volume: 0.3,
      autoplay: false,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onloaderror: (id, err) => console.log('Load error:', err),
      onplayerror: (id, err) => console.log('Play error:', err)
    })

    // We don't want to scroll on initial load anymore
    // Only when graduation time is reached (handled in the celebration trigger)

    return () => {
      if (soundRef.current) {
        soundRef.current.unload()
      }
    }
  }, [])

  // Handle user interaction during graduation only
  useEffect(() => {
    if (!isGraduationTime) return // Only add listeners during graduation

    const handleInteraction = () => {
      setUserInteracted(true)
      if (soundRef.current && !isPlaying) {
        soundRef.current.play()
        setIsPlaying(true)
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('scroll', handleInteraction)
      document.removeEventListener('mousemove', handleInteraction)
    }

    document.addEventListener('click', handleInteraction)
    document.addEventListener('keydown', handleInteraction)
    document.addEventListener('scroll', handleInteraction)
    document.addEventListener('mousemove', handleInteraction)

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('scroll', handleInteraction)
      document.removeEventListener('mousemove', handleInteraction)
    }
  }, [isGraduationTime, isPlaying])

  // Handle visibility and sound
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && soundRef.current && isPlaying) {
        soundRef.current.pause()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isPlaying])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unload()
      }
    }
  }, [soundRef])

  // Toggle audio function
  const toggleAudio = () => {
    if (!soundRef.current) return

    if (isPlaying) {
      soundRef.current.pause()
    } else {
      soundRef.current.play()
    }
  }

  // Calculate time difference and trigger celebration
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const difference = GRADUATION_DATE.getTime() - now.getTime()

      // If graduation time has been reached
      if (difference <= 0) {
        setIsGraduationTime(true) // Set graduation time flag
        if (!hasCelebrated) {
          triggerCelebration()
        }
        setTimeLeft({
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00'
        })
        return
      }

      // Otherwise, calculate remaining time
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({
        days: days.toString().padStart(2, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasCelebrated])

  // Trigger celebration effect
  const triggerCelebration = () => {
    if (hasCelebrated) return
    setHasCelebrated(true)

    // Show message to interact
    toast.success("🎓 Click anywhere to start the celebration!", {
      description: "Move your mouse, scroll, or press any key to begin!",
      duration: 5000
    })

    // Fade out timer
    if (timerRef.current) {
      timerRef.current.style.transition = 'opacity 1s ease-out'
      timerRef.current.style.opacity = '0'
      setTimeout(() => setShowTimer(false), 1000)
      
      // Scroll to timer when graduation time is reached
      timerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Start confetti immediately
    startConfetti()
  }

  // Separate confetti function
  const startConfetti = () => {
    const duration = 15 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      }))
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      }))
    }, 250)

    celebrationIntervalRef.current = interval
  }

  return (
    <>
      <div ref={countdownRef} className="flex flex-col items-center space-y-8 sm:space-y-10 w-full max-w-4xl mx-auto bg-gradient-to-b from-black/90 to-black p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/5">
        {/* Show interaction message during graduation */}
        {isGraduationTime && !userInteracted && (
          <div className="text-center text-white/80 mb-4">
            <p>Click anywhere to start the celebration music! 🎵</p>
          </div>
        )}
        {/* Show a message if we're waiting for user interaction */}
        {!isGraduationTime && !userInteracted && !showTimer && (
          <div className="text-center text-white/80 mb-4">
            <p>Click anywhere to enable celebration music! 🎵</p>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-y-8 md:gap-x-8 md:gap-y-8 w-full">
          {/* Timer - Only show when showTimer is true */}
          {showTimer && (
            <div ref={timerRef} className="w-full">
              {/* Days - Full width on mobile */}
              <div className="flex justify-center w-full md:w-auto">
                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                  <div className="flex space-x-[1px] sm:space-x-[2px]">
                    {timeLeft.days.split('').map((digit, i) => (
                      <SplitFlapChar key={`days-${i}`} value={digit} playSound={false} />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-mono tracking-widest text-neutral-400 uppercase">Days</span>
                </div>
              </div>

              {/* Time units container - Row on mobile, part of flex-wrap on desktop */}
              <div className="flex justify-between md:justify-center w-full md:w-auto md:flex-wrap gap-4 sm:gap-6 md:gap-x-8">
                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                  <div className="flex space-x-[1px] sm:space-x-[2px]">
                    {timeLeft.hours.split('').map((digit, i) => (
                      <SplitFlapChar key={`hours-${i}`} value={digit} playSound={false} />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-mono tracking-widest text-neutral-400 uppercase">Hours</span>
                </div>

                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                  <div className="flex space-x-[1px] sm:space-x-[2px]">
                    {timeLeft.minutes.split('').map((digit, i) => (
                      <SplitFlapChar key={`minutes-${i}`} value={digit} playSound={false} />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-mono tracking-widest text-neutral-400 uppercase">Minutes</span>
                </div>

                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                  <div className="flex space-x-[1px] sm:space-x-[2px]">
                    {timeLeft.seconds.split('').map((digit, i) => (
                      <SplitFlapChar key={`seconds-${i}`} value={digit} playSound={false} />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-mono tracking-widest text-neutral-400 uppercase">Seconds</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Link href="/reserve" className="w-full max-w-[180px] sm:max-w-[200px]">
          <Button
            className="w-full py-4 sm:py-6 text-base sm:text-lg font-mono border border-white/10 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white to-neutral-100 hover:from-neutral-100 hover:to-neutral-200 text-black transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Reserve
          </Button>
        </Link>
      </div>

      {/* Audio Control Button - Only show after user has interacted */}
      {!showTimer && userInteracted && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onClick={toggleAudio}
          className="fixed bottom-6 left-6 z-50 p-4 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg transition-colors duration-200 group"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          ) : (
            <Play className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          )}
        </motion.button>
      )}
    </>
  )
}
