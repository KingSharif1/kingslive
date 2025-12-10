"use client"

import { useEffect, useRef, useState } from "react"



export function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDark, setIsDark] = useState(false)
    const [size, setSize] = useState({ width: 0, height: 0 })

    useEffect(() => {
        const updateSize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight })
        }
        updateSize()
        window.addEventListener("resize", updateSize)
        return () => window.removeEventListener("resize", updateSize)
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
        const canvas = canvasRef.current
        if (!canvas || size.width === 0 || size.height === 0) return

        const context = canvas.getContext("2d")
        if (!context) return
        const ctx = context

        const dpr = window.devicePixelRatio || 1
        canvas.style.width = `${size.width}px`
        canvas.style.height = `${size.height}px`
        canvas.width = dpr * size.width
        canvas.height = dpr * size.height
        ctx.scale(dpr, dpr)

        const { random, PI, cos, sin } = Math


        // Use sakura-ish colors + minimal nature colors
        const blossomColors = ['#ffb7b2', '#ff9aa2', '#ffdac1', '#ffffff', '#ffd1dc']
        const branchColor = isDark ? '#4a4a4a' : '#3d3d3d'

        // --- CLASSES ---

        class Blossom {
            x: number
            y: number
            size: number
            maxSize: number
            scale: number
            color: string
            growthSpeed: number
            rotation: number
            isFalling: boolean
            speedY: number
            speedX: number

            constructor(x: number, y: number, color: string) {
                this.x = x
                this.y = y
                this.color = color
                this.maxSize = 2 + random() * 4
                this.size = 0
                this.scale = 0
                this.growthSpeed = 0.05 + random() * 0.05
                this.rotation = random() * PI * 2
                this.isFalling = false
                this.speedY = 0
                this.speedX = 0
            }

            update() {
                if (this.scale < 1) {
                    this.scale += this.growthSpeed
                    if (this.scale > 1) this.scale = 1
                    this.size = this.maxSize * this.scale
                }

                // Small chance to fall
                if (!this.isFalling && random() < 0.0001) {
                    this.isFalling = true
                    this.speedY = 0.5 + random() * 1
                    this.speedX = (random() - 0.5) * 1
                }

                if (this.isFalling) {
                    this.y += this.speedY
                    this.x += this.speedX
                    this.rotation += 0.02

                    // Reset if out of bounds (optional, or just let them fall)
                    if (this.y > size.height + 50) {
                        this.isFalling = false
                        this.scale = 0
                        // Could respawn elsewhere but for now just hide
                    }
                }
            }

            draw() {
                if (this.size <= 0.1) return

                ctx.save()
                ctx.translate(this.x, this.y)
                ctx.rotate(this.rotation)
                ctx.fillStyle = this.color
                ctx.globalAlpha = 0.8

                // Draw simple flower/petal shape
                ctx.beginPath()
                for (let i = 0; i < 5; i++) {
                    ctx.rotate((PI * 2) / 5)
                    ctx.ellipse(0, this.size / 2, this.size / 3, this.size, 0, 0, PI * 2)
                }
                ctx.fill()

                // Center
                ctx.beginPath()
                ctx.fillStyle = "#fff" // Pollen
                ctx.arc(0, 0, this.size / 3, 0, PI * 2)
                ctx.fill()

                ctx.restore()
            }
        }

        interface BranchSegment {
            x: number
            y: number
            angle: number
            length: number
            currentLength: number // For growth animation
            growthSpeed: number
            thickness: number
            parent?: BranchSegment
            children: BranchSegment[]
            depth: number
            swayOffset: number
            baseAngle: number
            blossoms: Blossom[]
            isGrown: boolean // True when currentLength >= length
            spawnedChildren: boolean // To trigger child growth
        }

        // --- ANIMATION STATE ---

        let rootBranches: BranchSegment[] = []
        let particles: Blossom[] = [] // Also keep some floating ones if needed
        let animationId: number
        let time = 0

        // --- GENERATION ---

        const createBranch = (
            x: number,
            y: number,
            angle: number,
            length: number,
            thickness: number,
            depth: number
        ): BranchSegment => {
            const branch: BranchSegment = {
                x, y, angle, length, thickness, depth,
                currentLength: 0,
                growthSpeed: 2 + random() * 2, // px per frame
                children: [],
                swayOffset: random() * PI * 2,
                baseAngle: angle,
                blossoms: [],
                isGrown: false,
                spawnedChildren: false
            }

            if (depth > 0) {
                const numChildren = 1 + (random() < 0.4 ? 1 : 0)

                for (let i = 0; i < numChildren; i++) {
                    const newLength = length * (0.8 + random() * 0.2)
                    const newThickness = thickness * 0.7
                    const newAngle = angle + (random() - 0.5) * 1.5 // Wider spread

                    // Recursive creation - but don't add to children array yet technically? 
                    // No, we add them but don't draw/update them until parent grows.
                    // Actually, let's pre-generate the structure and just animate the 'currentLength'.

                    const child = createBranch(
                        0, 0, // Placeholder positions (calculated relative to parent later)
                        newAngle,
                        newLength,
                        newThickness,
                        depth - 1
                    )
                    child.parent = branch
                    branch.children.push(child)
                }
            }
            return branch
        }

        // --- DRAWING & UPDATING ---

        const updateBranch = (branch: BranchSegment) => {
            // Grow
            if (!branch.isGrown) {
                branch.currentLength += branch.growthSpeed
                if (branch.currentLength >= branch.length) {
                    branch.currentLength = branch.length
                    branch.isGrown = true
                }
            }

            // Sway logic
            const swayAmount = 0.002 * (15 - branch.depth)
            branch.angle = branch.baseAngle + Math.sin(time * 0.001 + branch.swayOffset) * swayAmount

            // Calculate end position
            const endX = branch.x + cos(branch.angle) * branch.currentLength
            const endY = branch.y + sin(branch.angle) * branch.currentLength

            // Draw branch
            if (branch.currentLength > 0.5) {
                ctx.beginPath()
                ctx.moveTo(branch.x, branch.y)
                ctx.lineTo(endX, endY)
                ctx.strokeStyle = branchColor
                ctx.lineWidth = branch.thickness
                ctx.lineCap = 'round'
                ctx.stroke()
            }

            // Spawn blossoms if fully grown (just once)
            if (branch.isGrown && branch.blossoms.length === 0 && random() < 0.4) {
                // Add a blossom at the end or along the branch
                const blossom = new Blossom(
                    endX + (random() - 0.5) * 5,
                    endY + (random() - 0.5) * 5,
                    blossomColors[Math.floor(random() * blossomColors.length)]
                )
                branch.blossoms.push(blossom)
            }

            // Update/Draw Blossoms
            branch.blossoms.forEach(b => {
                // If it falls, it might detach from branch visual, but for now specific coord updates
                if (b.isFalling) {
                    b.update() // Update its position independently
                } else {
                    // Stick to branch tip
                    b.x = endX
                    b.y = endY
                    b.update() // Update scale
                }
                b.draw()
            })

            // Propagate growth to children
            if (branch.isGrown) {
                branch.children.forEach(child => {
                    // Update child start pos
                    child.x = endX
                    child.y = endY
                    updateBranch(child)
                })
            }
        }

        const init = () => {
            rootBranches = []
            particles = []

            // Create branches
            const scale = Math.min(size.width, size.height) / 800

            // Left side growing in
            rootBranches.push(createBranch(
                0, size.height * 0.3,
                0.2, // Angle pointing right-ish
                50 * scale,
                10 * scale,
                11
            ))

            // Right side growing in
            rootBranches.push(createBranch(
                size.width, size.height * 0.7,
                PI - 0.2, // Pointing left-ish
                50 * scale,
                10 * scale,
                11
            ))

            // Also maybe one from bottom left corner
            rootBranches.push(createBranch(
                0, size.height,
                -PI / 4,
                60 * scale,
                12 * scale,
                10
            ))
        }

        const animate = () => {
            ctx.clearRect(0, 0, size.width, size.height)
            time += 16

            // Update and draw branches
            rootBranches.forEach(branch => updateBranch(branch))

            animationId = requestAnimationFrame(animate)
        }

        init()
        animate()

        return () => {
            cancelAnimationFrame(animationId)
        }
    }, [size, isDark])

    return (
        <div className="fixed top-0 bottom-0 left-0 right-0 pointer-events-none print:hidden z-[-1]">
            <canvas ref={canvasRef} />
        </div>
    )
}
