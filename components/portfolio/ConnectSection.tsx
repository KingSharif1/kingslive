'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const ContactForm = dynamic(
  () => import('@/components/ContactForm').then((mod) => ({ default: mod.ContactForm })),
  {
    ssr: false,
    loading: () => <div className="text-center py-8 text-muted-foreground">Loading form...</div>,
  }
)

export function ConnectSection() {
  const [showContactForm, setShowContactForm] = useState(false)

  return (
    <section id="connect" className="py-20 sm:py-32 opacity-95">
      <div className="space-y-12 sm:space-y-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h2 className="text-3xl sm:text-4xl font-light font-outfit">Let&apos;s Connect</h2>
          <div className="text-sm text-muted-foreground font-mono">GET IN TOUCH</div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-3xl -z-10" />

          <div className="p-8 sm:p-12 rounded-3xl border border-border/50 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl sm:text-3xl font-light font-outfit">Have a project in mind?</h3>
                <p className="text-lg text-muted-foreground leading-relaxed font-roboto">
                  I&apos;m always open to discussing new opportunities, creative ideas, or just having a friendly chat
                  about web development.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowContactForm(true)
                  setTimeout(() => {
                    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    document
                      .getElementById('contact-form')
                      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
                  }, 150)
                }}
                className="group relative px-8 py-4 rounded-full font-medium text-primary-foreground overflow-hidden transition-all duration-300 motion-safe:hover:scale-105"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary" />
                <span className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                  Start a Conversation
                  <svg
                    className="w-4 h-4 transform motion-safe:group-hover:translate-y-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </span>
              </button>
            </div>

            <div className="mt-12 pt-8 border-t border-border/50">
              <p className="text-center text-sm text-muted-foreground mb-6">Or find me on</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://github.com/KingSharif1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-accent/50 hover:bg-accent border border-transparent hover:border-border transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                  </svg>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    GitHub
                  </span>
                </a>

                <a
                  href="https://linkedin.com/in/king-sharif/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-accent/50 hover:bg-accent border border-transparent hover:border-border transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    LinkedIn
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {showContactForm && (
          <div id="contact-form" className="overflow-hidden">
            <ContactForm onClose={() => setShowContactForm(false)} />
          </div>
        )}
      </div>
    </section>
  )
}
