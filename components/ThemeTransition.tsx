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

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleClick = () => {
        const targetColor = isDark ? 'hsl(0 0% 98%)' : 'hsl(240 10% 4%)'
        setTransitionColor(targetColor)
        setIsAnimating(true)
        document.body.classList.add('theme-transitioning')

        setTimeout(() => {
            onToggle()
        }, 600)

        setTimeout(() => {
            setIsAnimating(false)
            setTransitionColor(null)
            document.body.classList.remove('theme-transitioning')
        }, 1200)
    }

    const overlay = isAnimating && mounted && transitionColor ? createPortal(
        <div
            ref={overlayRef}
            className="pointer-events-none fixed inset-0 z-[99999]"
            style={{
                background: transitionColor,
                clipPath: 'circle(0px at 50vw 50vh)',
                animation: 'themeExpandCenter 1200ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
            }}
        />,
        document.body
    ) : null

    return (
        <>
            <button
                onClick={handleClick}
                className="group p-2 hover:bg-accent/50 rounded-lg transition-all duration-300 relative overflow-hidden"
                aria-label="Toggle theme"
            >
                <div className="relative w-5 h-5">
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
            {overlay}
        </>
    )
}
