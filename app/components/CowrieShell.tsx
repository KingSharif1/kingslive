"use client"

import { useRef, useEffect } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { useGLTF, OrbitControls, Environment } from "@react-three/drei"
import { Mesh, TextureLoader, MeshStandardMaterial, Vector3 } from "three"

function Shell({ scrollY }: { scrollY: number }) {
  const meshRef = useRef<Mesh>(null!)
  const { scene } = useGLTF(
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cowrie_Shell_0111064149_texture-6eGnDiYIss7JWWzshTJASqedaFO3FJ.glb",
  )
  const texture = useLoader(
    TextureLoader,
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cowrie_Shell_0111051113_texture-PmvhqUxHXiT8WkaldMTXyiiqH1MTZG.png",
  )

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = new MeshStandardMaterial({
          map: texture,
          roughness: 0.5,
          metalness: 0.5,
        })
      }
    })
  }, [scene, texture])

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotate the shell
      meshRef.current.rotation.y = scrollY * 0.002 + state.clock.elapsedTime * 0.1
      meshRef.current.rotation.x = Math.sin(scrollY * 0.001) * 0.3

      // Move the shell in a circular path
      const time = state.clock.getElapsedTime()
      const radius = 3 // Adjust this value to change the size of the circular path
      const speed = 0.2 // Adjust this value to change the speed of the movement
      meshRef.current.position.x = Math.sin(time * speed) * radius
      meshRef.current.position.y = Math.cos(time * speed) * radius

      // Add a subtle floating effect
      meshRef.current.position.y += Math.sin(time * 2) * 0.1

      // Scale the shell (breathing effect)
      const baseScale = 2
      const breathingScale = Math.sin(state.clock.elapsedTime * 2) * 0.05
      meshRef.current.scale.setScalar(baseScale + breathingScale)
    }
  })

  return <primitive object={scene} ref={meshRef} />
}

export default function CowrieShell({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <Canvas shadows camera={{ position: [0, 0, 15], fov: 50 }}>
      <ambientLight intensity={0.7} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
      <Shell scrollY={scrollY} />
      <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.5} />
      <Environment preset="studio" />
    </Canvas>
  )
}

