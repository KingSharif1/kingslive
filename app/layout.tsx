import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import SnowAnimation from '@/components/SnowAnimation'
import ChatBot from './components/ChatBot'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'King Sharif',
  description: 'Portfolio of King Sharif',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SnowAnimation />
          {children}
          <ChatBot />
          <Toaster 
            richColors 
            position="top-center"
            toastOptions={{
              style: {
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                color: 'white',
                fontSize: '1.2em',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
              },
              className: 'celebration-toast'
            }}
          />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
