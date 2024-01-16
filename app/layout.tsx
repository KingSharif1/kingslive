import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'King Sharif',
  description: 'King Sharif\' portfolio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navbar/>
        <main className='relative overflow-hidden'>
          {children}
        </main>
        
        <Footer/>
      </body>
    </html>
  )
}
