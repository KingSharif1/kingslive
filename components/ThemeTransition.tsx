"use client"

import { useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface ThemeTransitionProps {
    isDark: boolean
    onToggle: () => void
}

export function ThemeTransition({ isDark, onToggle }: ThemeTransitionProps) {
    const [isAnimating, setIsAnimating] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [transitionColor, setTransitionColor] = useState<string | null>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    // Ensure we're mounted before using portal
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleClick = () => {
        // Capture the TARGET color at the start (opposite of current theme)
        // If currently dark -> going to light, circle should be light
        // If currently light -> going to dark, circle should be dark
        const targetColor = isDark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 4%)'
        setTransitionColor(targetColor)
        setIsAnimating(true)

        // Hide the header during transition to avoid visual glitches
        document.body.classList.add('theme-transitioning')

        // Start the theme change when the circle covers the screen
        // Animation is 1200ms, so 600ms is halfway (fully covered due to layout)
        setTimeout(() => {
            onToggle()
        }, 600)

        // End animation after it completes
        setTimeout(() => {
            setIsAnimating(false)
            setTransitionColor(null)
            document.body.classList.remove('theme-transitioning')
        }, 1200)
    }

    // Calculate the maximum radius needed to cover the entire screen from center
    const getMaxRadius = () => {
        if (typeof window === 'undefined') return 2000
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2
        return Math.sqrt(centerX * centerX + centerY * centerY) * 1.15
    }

    // Render overlay via portal to ensure it's always positioned relative to viewport
    const overlay = isAnimating && mounted && transitionColor ? createPortal(
        <div
            ref={overlayRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 99999,
                background: transitionColor, // Use the captured color
                clipPath: `circle(0px at 50vw 50vh)`,
                animation: `themeExpandCenter 1200ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards`,
            }}
        />,
        document.body
    ) : null

    return (
        <>
            {/* Theme toggle button */}
            <button
                onClick={handleClick}
                className="group p-2 hover:bg-accent/50 rounded-lg transition-all duration-300 relative overflow-hidden"
                aria-label="Toggle theme"
            >
                <div className="relative w-5 h-5">
                    {/* Sun icon */}
                    <svg
                        className={`absolute inset-0 w-5 h-5 text-muted-foreground group-hover:text-foreground transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
                            }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                    >
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>

                    {/* Moon icon */}
                    <svg
                        className={`absolute inset-0 w-5 h-5 text-muted-foreground group-hover:text-foreground transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                            }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                </div>
            </button>

            {/* Render overlay outside header via portal */}
            {overlay}

            <style jsx global>{`
                @keyframes themeExpandCenter {
                    0% {
                        clip-path: circle(0px at 50vw 50vh);
                    }
                    100% {
                        clip-path: circle(${getMaxRadius()}px at 50vw 50vh);
                    }
                }
                
                /* Hide header completely during theme transition */
                body.theme-transitioning header,
                body.theme-transitioning header > div {
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    background: transparent !important;
                    border-color: transparent !important;
                    box-shadow: none !important;
                }
            `}</style>
        </>
    )
}
