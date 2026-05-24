import './globals.css'
import { Unbounded, Sora, Young_Serif, Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { ParticleBackgroundWrapper } from "@/components/ParticleBackgroundWrapper"

// Portfolio fonts
const unbounded = Unbounded({
  subsets: ['latin'],
  variable: '--font-unbounded',
  display: 'swap',
  preload: true,
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  preload: true,
})

// ─── Ctroom font system ───────────────────────────────
// font-display → Young Serif  (section titles / view headings)
// font-inter   → Inter        (body, labels, buttons — ctroom default)
// font-mono    → JetBrains Mono (stats, numbers, code/project tags)

const youngSerif = Young_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
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
      <body className={`${unbounded.variable} ${sora.variable} ${youngSerif.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans`}>
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
        </ThemeProvider>
      </body>
    </html>
  )
}

