import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { Provider } from './Providers'
import ThemeSwitch from '@/components/ThemeSwitch'

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <Navbar/>
          <main className='relative overflow-hidden'>
            {children}
          </main>
          <Footer/>
        </Provider>
      </body>
    </html>
  )
}
