"use client"

import { useEffect, useState, useRef } from "react"

export function CustomCursor() {
    // Direct position for the dot (follows mouse instantly)
    const [dotPosition, setDotPosition] = useState({ x: -100, y: -100 })
    // Smoothed position for the ring (trails behind)
    const [ringPosition, setRingPosition] = useState({ x: -100, y: -100 })
    const [isHovering, setIsHovering] = useState(false)
    const [isClicking, setIsClicking] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const [isTouchDevice, setIsTouchDevice] = useState(true)
    const animationRef = useRef<number>()
    const targetRef = useRef({ x: -100, y: -100 })

    useEffect(() => {
        // Check for touch device
        const checkTouch = () => {
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
            setIsTouchDevice(isTouch)
        }
        checkTouch()
    }, [])

    useEffect(() => {
        if (isTouchDevice) return

        // Animation loop only for the ring (smooth trailing)
        const animate = () => {
            setRingPosition(prev => ({
                x: prev.x + (targetRef.current.x - prev.x) * 0.5,
                y: prev.y + (targetRef.current.y - prev.y) * 0.5
            }))
            animationRef.current = requestAnimationFrame(animate)
        }

        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isTouchDevice])

    useEffect(() => {
        if (isTouchDevice) return

        const handleMouseMove = (e: MouseEvent) => {
            // Dot follows mouse instantly (no lerp)
            setDotPosition({ x: e.clientX, y: e.clientY })
            // Ring target updates for smooth trailing
            targetRef.current = { x: e.clientX, y: e.clientY }
            setIsVisible(true)
        }

        const handleMouseEnter = () => setIsVisible(true)
        const handleMouseLeave = () => setIsVisible(false)

        const handleMouseDown = () => setIsClicking(true)
        const handleMouseUp = () => setIsClicking(false)

        // Add hover detection for interactive elements
        const handleElementHover = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const isInteractive = Boolean(
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('a') ||
                target.closest('button') ||
                target.getAttribute('role') === 'button' ||
                target.classList.contains('cursor-pointer') ||
                getComputedStyle(target).cursor === 'pointer'
            )

            setIsHovering(isInteractive)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mousemove', handleElementHover)
        document.addEventListener('mouseenter', handleMouseEnter)
        document.addEventListener('mouseleave', handleMouseLeave)
        document.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mousemove', handleElementHover)
            document.removeEventListener('mouseenter', handleMouseEnter)
            document.removeEventListener('mouseleave', handleMouseLeave)
            document.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isTouchDevice])

    // Don't render on touch devices
    if (isTouchDevice) return null

    return (
        <>
            {/* Main cursor dot - follows mouse INSTANTLY for natural feel */}
            <div
                className={`fixed pointer-events-none z-[10000] mix-blend-difference ${isVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                style={{
                    left: dotPosition.x,
                    top: dotPosition.y,
                    transform: `translate(-50%, -50%) scale(${isClicking ? 0.7 : 1})`,
                    transition: 'transform 0.1s ease-out, opacity 0.2s ease',
                }}
            >
                <div
                    className="rounded-full bg-white"
                    style={{
                        width: isHovering ? 6 : 10,
                        height: isHovering ? 6 : 10,
                        transition: 'width 0.2s ease, height 0.2s ease',
                    }}
                />
            </div>

            {/* Outer ring - trails behind for elegant effect */}
            <div
                className={`fixed pointer-events-none z-[9999] rounded-full border border-white/80 mix-blend-difference ${isVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                style={{
                    left: ringPosition.x,
                    top: ringPosition.y,
                    width: isHovering ? 56 : 40,
                    height: isHovering ? 56 : 40,
                    transform: `translate(-50%, -50%) scale(${isClicking ? 0.85 : 1})`,
                    transition: 'width 0.25s ease, height 0.25s ease, transform 0.15s ease-out, opacity 0.2s ease',
                }}
            />

            <style jsx global>{`
        * {
          cursor: none !important;
        }
        
        @media (hover: none) and (pointer: coarse) {
          * {
            cursor: auto !important;
          }
        }
      `}</style>
        </>
    )
}
