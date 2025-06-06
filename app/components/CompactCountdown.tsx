'use client'

import { useEffect, useState, useRef } from 'react'
import { SplitFlapChar } from './SplitFlapChar'

// Set your graduation date here (12:00 PM Central Time - Texas)
const GRADUATION_DATE = new Date('2025-05-09T12:00:00-05:00')

export function CompactCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: '000',
    hours: '00',
    minutes: '00',
    seconds: '00'
  })
  const [shouldAllowSound, setShouldAllowSound] = useState(true)
  const tickAudioRef = useRef<HTMLAudioElement | null>(null)
  const soundStartTimeRef = useRef<number>(Date.now())

  // Initialize tick sound
  useEffect(() => {
    if (typeof window !== 'undefined') {
      tickAudioRef.current = new Audio('/sounds/tick.mp3')
      tickAudioRef.current.volume = 0.10
      soundStartTimeRef.current = Date.now()

      // Disable sound after 5 seconds
      const soundTimeout = setTimeout(() => {
        setShouldAllowSound(false)
      }, 500)

      return () => {
        clearTimeout(soundTimeout)
        if (tickAudioRef.current) {
          tickAudioRef.current.pause()
          tickAudioRef.current.currentTime = 0
        }
      }
    }
  }, [])

  useEffect(() => {
    function updateCountdown() {
      const now = new Date()
      const timeDifference = GRADUATION_DATE.getTime() - now.getTime()

      const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000)

      setTimeLeft({
        days: days.toString().padStart(3, '0'),
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0')
      })

      // Play tick sound if within first 5 seconds
      const elapsedTime = Date.now() - soundStartTimeRef.current
      if (shouldAllowSound && tickAudioRef.current && elapsedTime <= 5000) {
        tickAudioRef.current.currentTime = 0
        tickAudioRef.current.play().catch(() => {})
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [shouldAllowSound])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1">
          {timeLeft.days.split('').map((digit, index) => (
            <SplitFlapChar key={`days-${index}`} value={digit} className="text-4xl" />
          ))}
        </div>
        <span className="text-sm text-neutral-400 mt-1">DAYS</span>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1">
          {timeLeft.hours.split('').map((digit, index) => (
            <SplitFlapChar key={`hours-${index}`} value={digit} className="text-2xl" />
          ))}
          <span className="text-neutral-400 text-2xl">:</span>
          {timeLeft.minutes.split('').map((digit, index) => (
            <SplitFlapChar key={`minutes-${index}`} value={digit} className="text-2xl" />
          ))}
          <span className="text-neutral-400 text-2xl">:</span>
          {timeLeft.seconds.split('').map((digit, index) => (
            <SplitFlapChar key={`seconds-${index}`} value={digit} className="text-2xl" />
          ))}
        </div>
        <span className="text-sm text-neutral-400 mt-1">TIME REMAINING</span>
      </div>
    </div>
  )
}
