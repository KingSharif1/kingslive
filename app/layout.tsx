import './globals.css'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ParticleBackgroundWrapper } from "@/components/ParticleBackgroundWrapper"
import { AnalyticsWrapper } from "@/components/AnalyticsWrapper"

// Only 2 essential fonts - massive reduction for performance
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  preload: false, // Secondary font, don't preload
})

export const metadata = {
  title: 'King Sharif',
  description: 'Portfolio of King Sharif - Full Stack Developer',
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL('https://kingsharif.com'),
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
      </head>
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ParticleBackgroundWrapper />
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
          <AnalyticsWrapper />
        </ThemeProvider>
      </body>
    </html>
  )
}

