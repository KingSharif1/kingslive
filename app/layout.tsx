import './globals.css'
import { Unbounded, Sora } from 'next/font/google'
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ParticleBackgroundWrapper } from "@/components/ParticleBackgroundWrapper"
import { AnalyticsWrapper } from "@/components/AnalyticsWrapper"

// Unbounded for headers - bold geometric display font
const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
  display: 'swap',
  preload: true,
})

// Sora for body - smooth, modern sans-serif
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  preload: true,
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
      <body className={`${unbounded.variable} ${sora.variable} font-sans`}>
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

