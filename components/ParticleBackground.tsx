"use client"

import { useEffect, useRef, useState } from "react"

export function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDark, setIsDark] = useState(false)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [isMobile, setIsMobile] = useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        // Check for reduced motion preference and mobile
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(motionQuery.matches)
        setIsMobile(window.innerWidth < 768)
        
        let timeoutId: NodeJS.Timeout
        const updateSize = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                setSize({ width: window.innerWidth, height: window.innerHeight })
                setIsMobile(window.innerWidth < 768)
            }, 150)
        }
        updateSize()
        window.addEventListener("resize", updateSize, { passive: true })
        return () => {
            window.removeEventListener("resize", updateSize)
            clearTimeout(timeoutId)
        }
    }, [])

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'))
        }
        checkTheme()
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        // Skip animation on mobile or if user prefers reduced motion
        if (prefersReducedMotion || isMobile) return
        
        const canvas = canvasRef.current
        if (!canvas || size.width === 0 || size.height === 0) return

        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.style.width = `${size.width}px`
        canvas.style.height = `${size.height}px`
        canvas.width = Math.floor(dpr * size.width)
        canvas.height = Math.floor(dpr * size.height)
        ctx.scale(dpr, dpr)

        const { random, PI, sin, floor } = Math

        // Beautiful sakura petal colors
        const petalColors = isDark 
            ? ['#ffb7b2', '#ff9aa2', '#ffdac1', '#ffeef0', '#ffd1dc', '#ffccd5']
            : ['#ffb7b2', '#ff9aa2', '#ffc8c8', '#ffeef0', '#ffd1dc', '#ffe4e8']

        // Petal class - simple falling cherry blossom petals
        class Petal {
            x: number
            y: number
            size: number
            rotation: number
            rotationSpeed: number
            speedY: number
            speedX: number
            opacity: number
            color: string
            swayPhase: number
            swayAmplitude: number

            constructor(startFromTop = true) {
                this.x = random() * size.width
                this.y = startFromTop ? -20 - random() * 50 : random() * size.height
                this.size = 6 + random() * 10
                this.rotation = random() * PI * 2
                this.rotationSpeed = (random() - 0.5) * 0.03
                this.speedY = 0.2 + random() * 0.4 // Gentle falling
                this.speedX = (random() - 0.2) * 0.2
                this.opacity = 0.4 + random() * 0.4
                this.color = petalColors[floor(random() * petalColors.length)]
                this.swayPhase = random() * PI * 2
                this.swayAmplitude = 0.5 + random() * 1
            }

            update(time: number) {
                this.y += this.speedY
                // Gentle swaying motion
                this.x += this.speedX + sin(time * 0.0008 + this.swayPhase) * this.swayAmplitude
                this.rotation += this.rotationSpeed

                // Reset when off screen
                if (this.y > size.height + 30) {
                    this.y = -20 - random() * 30
                    this.x = random() * size.width
                    this.speedY = 0.4 + random() * 0.8
                    this.opacity = 0.4 + random() * 0.4
                }
                // Wrap horizontally
                if (this.x < -30) this.x = size.width + 20
                if (this.x > size.width + 30) this.x = -20
            }

            draw() {
                if (!ctx) return
                ctx?.save()
                ctx?.translate(floor(this.x), floor(this.y))
                ctx?.rotate(this.rotation)
                ctx.globalAlpha = this.opacity

                // Draw a beautiful petal shape
                ctx.fillStyle = this.color
                ctx.beginPath()
                // Main petal body - curved ellipse
                ctx.ellipse(0, 0, this.size * 0.35, this.size * 0.8, 0, 0, PI * 2)
                ctx.fill()

                // Add a subtle gradient/highlight
                ctx.globalAlpha = this.opacity * 0.3
                ctx.fillStyle = '#ffffff'
                ctx.beginPath()
                ctx.ellipse(-this.size * 0.1, -this.size * 0.2, this.size * 0.15, this.size * 0.3, -0.3, 0, PI * 2)
                ctx.fill()

                ctx.restore()
            }
        }

        let petals: Petal[] = []
        let animationId: number
        let time = 0

        // Initialize petals scattered across the screen
        const init = () => {
            petals = []
            // Create initial petals - some scattered, some starting from top
            const numPetals = Math.min(35, Math.floor((size.width * size.height) / 25000))
            
            for (let i = 0; i < numPetals; i++) {
                petals.push(new Petal(i > numPetals / 2)) // Half start scattered, half from top
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, size.width, size.height)
            time += 16

            // Update and draw all petals
            petals.forEach(petal => {
                petal.update(time)
                petal.draw()
            })

            animationId = requestAnimationFrame(animate)
        }

        init()
        animate()

        return () => {
            cancelAnimationFrame(animationId)
        }
    }, [size, isDark, prefersReducedMotion, isMobile])

    // Don't render canvas on mobile or reduced motion
    if (prefersReducedMotion || isMobile) {
        return null
    }

    return (
        <div className="fixed inset-0 pointer-events-none print:hidden z-[-1]">
            <canvas ref={canvasRef} />
        </div>
    )
}
