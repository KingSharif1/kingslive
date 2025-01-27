'use client'

import { useEffect, useState, useRef } from 'react'
import { SplitFlapChar } from './SplitFlapChar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Set your graduation date here (12:00 PM Central Time - Texas)
const GRADUATION_DATE = new Date('2025-05-09T12:00:00-05:00')

export function GraduationCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: '000',
    hours: '00',
    minutes: '00',
    seconds: '00'
  })
  const [isReversed, setIsReversed] = useState(false)
  const [shouldPlayTick, setShouldPlayTick] = useState(false)
  const countdownRef = useRef<HTMLDivElement>(null)
  const tickAudioRef = useRef<HTMLAudioElement | null>(null)
  const tickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize tick sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      tickAudioRef.current = new Audio('/sounds/tick.mp3')
      tickAudioRef.current.volume = 0.15 // Lower volume
    }

    return () => {
      if (tickTimeoutRef.current) {
        clearTimeout(tickTimeoutRef.current)
      }
    }
  }, [])

  // Handle visibility and sound
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldPlayTick(true)
          let tickCount = 0
          
          const playTick = () => {
            if (tickCount < 5 && tickAudioRef.current) {
              tickAudioRef.current.currentTime = 0
              tickAudioRef.current.play().catch(() => {})
              tickCount++
              tickTimeoutRef.current = setTimeout(playTick, 1000)
            } else {
              setShouldPlayTick(false)
            }
          }
          
          playTick()
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )

    if (countdownRef.current) {
      observer.observe(countdownRef.current)
    }

    return () => {
      observer.disconnect()
      if (tickTimeoutRef.current) {
        clearTimeout(tickTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const targetDate = isReversed ? now : GRADUATION_DATE
      const startDate = isReversed ? GRADUATION_DATE : now
      const difference = Math.abs(targetDate.getTime() - startDate.getTime())

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({
        days: days.toString().padStart(3, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [isReversed])

  return (
    <div ref={countdownRef} className="flex flex-col items-center space-y-8 sm:space-y-10 w-full max-w-4xl mx-auto bg-gradient-to-b from-black/90 to-black p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] border border-white/5">
      <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-y-8 md:gap-x-8 md:gap-y-8 w-full">
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

      <Link href="/reserve" className="w-full max-w-[180px] sm:max-w-[200px]">
        <Button
          className="w-full py-4 sm:py-6 text-base sm:text-lg font-mono border border-white/10 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white to-neutral-100 hover:from-neutral-100 hover:to-neutral-200 text-black transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Reserve
        </Button>
      </Link>
    </div>
  )
}
