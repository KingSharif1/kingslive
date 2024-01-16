import About from '@/components/About'
import Hero from '@/components/Hero'
import Portfolio from '@/components/Portfolio'
import Skills from '@/components/Skills'
import React from 'react'

const page = () => {
  return (
    <main>
    <>
    <Hero/>
    <About/>
    <Skills/>
    <Portfolio/>
    </>  
    </main>
  )
}

export default page