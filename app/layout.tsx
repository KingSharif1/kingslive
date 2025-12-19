import './globals.css'
import { Inter, Space_Grotesk, Playfair_Display, Crimson_Pro, Unbounded, Plus_Jakarta_Sans, Outfit, Roboto, Open_Sans, Fraunces } from 'next/font/google'
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"

import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ParticleBackground } from '@/components/ParticleBackground'

// Home page fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
})

// Bold & Creative fonts (Option 4)
const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded'
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta'
})

// Light & Clean fonts (User requested)
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit'
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto'
})

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans'
})

// Blog page fonts
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair'
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces'
})

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-crimson'
})

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
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${playfairDisplay.variable} ${crimsonPro.variable} ${unbounded.variable} ${plusJakartaSans.variable} ${outfit.variable} ${roboto.variable} ${openSans.variable} ${fraunces.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ParticleBackground />
          {children}
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

