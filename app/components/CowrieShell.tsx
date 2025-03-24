"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

export default function CowrieShell({ scrollY = 0 }: { scrollY?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(scrollY)
  
  // Update ref when prop changes
  useEffect(() => {
    scrollYRef.current = scrollY
  }, [scrollY])
  
  useEffect(() => {
    if (!containerRef.current) return
    
    // Create scene, camera, and renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 15
    
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance" 
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap // Softer shadows
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    
    // Clear container and append renderer
    if (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild)
    }
    containerRef.current.appendChild(renderer.domElement)
    
    // Add lights for more realistic appearance
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    
    // Main key light - warm tone
    const keyLight = new THREE.DirectionalLight(0xfff0dd, 1.2)
    keyLight.position.set(5, 8, 10)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 50
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)
    
    // Fill light - cooler tone for contrast
    const fillLight = new THREE.DirectionalLight(0xe0f0ff, 0.6)
    fillLight.position.set(-5, 3, 8)
    scene.add(fillLight)
    
    // Rim light for highlighting edges
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
    rimLight.position.set(0, -5, -10)
    scene.add(rimLight)
    
    // Create a point light for the glow effect (initially off)
    const glowLight = new THREE.PointLight(0xffffcc, 0, 10) // Intensity 0 = off
    glowLight.position.set(0, 0, 0)
    scene.add(glowLight)
    
    // Create shell mesh placeholder
    let shellMesh: THREE.Group | null = null
    
    // Load model and texture
    const gltfLoader = new GLTFLoader()
    const textureLoader = new THREE.TextureLoader()
    
    // Track loading state
    let isLoading = true
    
    // Check for dark mode without using theme hooks
    const checkDarkMode = () => {
      // Check if the document has a dark class or prefers-color-scheme is dark
      return (
        document.documentElement.classList.contains('dark') || 
        window.matchMedia('(prefers-color-scheme: dark)').matches
      )
    }
    
    // Initial dark mode check
    let isDarkMode = checkDarkMode()
    
    // Set up listener for dark mode changes
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const darkModeObserver = new MutationObserver(() => {
      const newDarkMode = checkDarkMode()
      if (isDarkMode !== newDarkMode) {
        isDarkMode = newDarkMode
        // No re-rendering, just update the glow light intensity
        glowLight.intensity = isDarkMode ? 0.7 : 0
      }
    })
    
    // Start observing for class changes on html element (for dark mode toggle)
    darkModeObserver.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })
    
    // Also listen for system preference changes
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      isDarkMode = e.matches || document.documentElement.classList.contains('dark')
      // No re-rendering, just update the glow light intensity
      glowLight.intensity = isDarkMode ? 0.7 : 0
    }
    darkModeMediaQuery.addEventListener('change', handleDarkModeChange)
    
    // Set initial glow based on dark mode
    glowLight.intensity = isDarkMode ? 0.7 : 0
    
    // Load texture
    const textureUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cowrie_Shell_0111051113_texture-PmvhqUxHXiT8WkaldMTXyiiqH1MTZG.png"
    
    // Load texture
    textureLoader.load(
      textureUrl,
      (diffuseMap) => {
        // Enhance texture quality
        diffuseMap.anisotropy = renderer.capabilities.getMaxAnisotropy()
        
        // Then load model
        gltfLoader.load(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cowrie_Shell_0111064149_texture-6eGnDiYIss7JWWzshTJASqedaFO3FJ.glb",
          (gltf) => {
            shellMesh = gltf.scene
            
            // Fixed warm yellow color (no theme switching)
            const shellColor = 0xfff0c0
            
            // Apply enhanced materials to all mesh materials
            shellMesh.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                // Create a physically-based material for the shell
                const material = new THREE.MeshPhysicalMaterial({
                  map: diffuseMap,
                  roughness: 0.2,
                  metalness: 0.1,
                  clearcoat: 0.8,
                  clearcoatRoughness: 0.1,
                  reflectivity: 1.0,
                  color: shellColor,
                  transparent: true,
                  opacity: 0.95,
                  side: THREE.DoubleSide,
                  emissive: 0xffffcc, // Warm glow color
                  emissiveIntensity: isDarkMode ? 0.1 : 0 // Initial emissive based on dark mode
                })
                
                // Apply the material
                child.material = material
                
                // Enable shadows
                child.castShadow = true
                child.receiveShadow = true
              }
            })
            
            // Set initial scale
            shellMesh.scale.set(2, 2, 2)
            
            // Add to scene
            scene.add(shellMesh)
            isLoading = false
          },
          (progress) => {
            // Model loading progress
            console.log(`Loading model: ${Math.round(progress.loaded / progress.total * 100)}%`)
          },
          (error) => {
            console.error("Error loading model:", error)
            isLoading = false
          }
        )
      },
      undefined,
      (error) => {
        console.error("Error loading texture:", error)
        isLoading = false
      }
    )
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return
      
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    
    window.addEventListener("resize", handleResize)
    
    // Animation variables
    const clock = new THREE.Clock()
    let lastScrollY = scrollYRef.current
    let currentRotationY = 0
    let targetRotationY = 0
    let currentRotationX = 0
    let targetRotationX = 0
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      
      if (shellMesh && !isLoading) {
        // Get current scroll position from ref
        const currentScrollY = scrollYRef.current
        
        // Calculate scroll delta - with reduced sensitivity
        const scrollDelta = (currentScrollY - lastScrollY) * 0.5
        
        // Update rotation targets based on scroll
        const timeRotation = clock.getElapsedTime() * 0.05
        
        // Add subtle scroll influence with reduced sensitivity
        targetRotationY = timeRotation + (currentScrollY * 0.001)
        
        // Reduce x-axis rotation sensitivity
        targetRotationX = Math.sin(currentScrollY * 0.0002) * 0.1
        
        // Very smooth rotation with slower lerp factor
        currentRotationY += (targetRotationY - currentRotationY) * 0.01
        currentRotationX += (targetRotationX - currentRotationX) * 0.01
        
        // Apply rotations
        shellMesh.rotation.y = currentRotationY
        shellMesh.rotation.x = currentRotationX
        
        // Move in circular path - more gentle
        const time = clock.getElapsedTime()
        const radius = 2.5
        const speed = 0.15
        
        // Smooth position changes
        shellMesh.position.x = Math.sin(time * speed) * radius
        shellMesh.position.y = Math.cos(time * speed) * radius
        
        // Add a subtle floating effect
        const floatAmplitude = 0.05
        shellMesh.position.y += Math.sin(time * 1.5) * floatAmplitude
        
        // Breathing effect
        const baseScale = 2
        const breathingScale = Math.sin(time * 1.5) * 0.03
        
        shellMesh.scale.set(
          baseScale + breathingScale,
          baseScale + breathingScale,
          baseScale + breathingScale
        )
        
        // Update glow light position to follow shell
        glowLight.position.copy(shellMesh.position)
        
        // Pulsating glow effect in dark mode
        if (isDarkMode) {
          // Subtle pulsating glow intensity
          const pulseIntensity = 0.5 + Math.sin(time * 1.5) * 0.2
          glowLight.intensity = pulseIntensity
          
          // Update emissive intensity on all materials
          shellMesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
              child.material.emissiveIntensity = 0.05 + Math.sin(time * 1.5) * 0.05
            }
          })
        }
        
        // Update last scroll position with very gentle smoothing
        lastScrollY = lastScrollY + (currentScrollY - lastScrollY) * 0.05
      }
      
      renderer.render(scene, camera)
    }
    
    animate()
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange)
      darkModeObserver.disconnect()
      
      // Dispose of Three.js resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose()
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        }
      })
      
      scene.clear()
      renderer.dispose()
      
      if (containerRef.current && containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild)
      }
    }
  }, []) // Empty dependency array to run only once on mount
  
  return <div ref={containerRef} className="w-full h-full" />
}
