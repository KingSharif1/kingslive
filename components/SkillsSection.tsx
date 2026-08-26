'use client'

import { motion } from 'framer-motion'

type SkillId =
  | 'react'
  | 'nextjs'
  | 'typescript'
  | 'tailwind'
  | 'framer'
  | 'vite'
  | 'shadcn'
  | 'nodejs'
  | 'postgresql'
  | 'supabase'
  | 'sanity'
  | 'zod'
  | 'claude'
  | 'aisdk'
  | 'openai'
  | 'gemini'
  | 'git'
  | 'vercel'
  | 'figma'
  | 'teller'
  | 'recharts'
  | 'playwright'

type Skill = {
  id: SkillId
  name: string
}

type SkillGroup = {
  label: string
  blurb: string
  skills: Skill[]
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    label: 'Frontend',
    blurb: 'Product UI across HireIQ, RideNEMT, KingsLive, and more.',
    skills: [
      { id: 'react', name: 'React' },
      { id: 'nextjs', name: 'Next.js' },
      { id: 'typescript', name: 'TypeScript' },
      { id: 'tailwind', name: 'Tailwind' },
      { id: 'framer', name: 'Framer Motion' },
      { id: 'vite', name: 'Vite' },
      { id: 'shadcn', name: 'shadcn/ui' },
    ],
  },
  {
    label: 'Backend & Data',
    blurb: 'Auth, Postgres, CMS, and typed APIs.',
    skills: [
      { id: 'nodejs', name: 'Node.js' },
      { id: 'postgresql', name: 'PostgreSQL' },
      { id: 'supabase', name: 'Supabase' },
      { id: 'sanity', name: 'Sanity' },
      { id: 'zod', name: 'Zod' },
    ],
  },
  {
    label: 'AI & Automation',
    blurb: 'From HireIQ tailoring to Milo and agents.',
    skills: [
      { id: 'claude', name: 'Claude' },
      { id: 'aisdk', name: 'Vercel AI SDK' },
      { id: 'openai', name: 'OpenAI' },
      { id: 'gemini', name: 'Gemini' },
      { id: 'playwright', name: 'Playwright' },
    ],
  },
  {
    label: 'Tools & Ops',
    blurb: 'Ship, design, finance, and charts.',
    skills: [
      { id: 'git', name: 'Git' },
      { id: 'vercel', name: 'Vercel' },
      { id: 'figma', name: 'Figma' },
      { id: 'teller', name: 'Teller' },
      { id: 'recharts', name: 'Recharts' },
    ],
  },
]

function SkillIcon({ id }: { id: SkillId }) {
  const common = {
    viewBox: '0 0 24 24',
    className: 'h-5 w-5',
    fill: 'currentColor',
    'aria-hidden': true as const,
  }

  switch (id) {
    case 'react':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.2" />
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.4" transform="rotate(120 12 12)" />
        </svg>
      )
    case 'nextjs':
      return (
        <svg {...common}>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.2 14.8h-1.7l-5.4-8v8H7.6V7.2h1.8l5.3 7.9V7.2h1.5Z" />
        </svg>
      )
    case 'typescript':
      return (
        <svg {...common}>
          <path d="M3 3h18v18H3V3Zm9.4 14.2V12H9.8v-1.5h7.1V12h-2.7v5.2h-1.8ZM7.6 9.2h5.4v1.4H11v7.2H9.2V10.6H7.6V9.2Z" />
        </svg>
      )
    case 'tailwind':
      return (
        <svg {...common}>
          <path d="M12 6c-2.5 0-4.1 1.3-4.8 3.8.9-1.3 2-1.8 3.2-1.6 1 .2 1.6.8 2.4 1.5 1.2 1.2 2.6 2.5 5.3 2.5 2.5 0 4.1-1.3 4.8-3.8-.9 1.3-2 1.8-3.2 1.6-1-.2-1.6-.8-2.4-1.5C16.1 7.3 14.7 6 12 6Zm-4.8 7.2c-2.5 0-4.1 1.3-4.8 3.8.9-1.3 2-1.8 3.2-1.6 1 .2 1.6.8 2.4 1.5 1.2 1.2 2.6 2.5 5.3 2.5 2.5 0 4.1-1.3 4.8-3.8-.9 1.3-2 1.8-3.2 1.6-1-.2-1.6-.8-2.4-1.5-1.2-1.2-2.6-2.5-5.3-2.5Z" />
        </svg>
      )
    case 'framer':
      return (
        <svg {...common}>
          <path d="M5 2h14v6.5H12L19 15.5H5V9h7L5 2Zm0 13.5h7V22l-7-6.5Z" />
        </svg>
      )
    case 'vite':
      return (
        <svg {...common}>
          <path d="M12 2 2.5 5.5l1.7 12L12 22l7.8-4.5 1.7-12L12 2Zm0 2.2 7.1 2.7-1.3 9.1L12 19.5l-5.8-3.5-1.3-9.1L12 4.2Zm-.9 3.3h1.8l.3 5.2h-2.4l.3-5.2Zm0 6.4h1.8V16h-1.8v-2.1Z" />
        </svg>
      )
    case 'shadcn':
      return (
        <svg {...common}>
          <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm12.2 0 .8.8-4.4 4.4-.8-.8 4.4-4.4Zm2.1 2.1.8.8-4.4 4.4-.8-.8 4.4-4.4Z" />
        </svg>
      )
    case 'nodejs':
      return (
        <svg {...common}>
          <path d="M12 2.2 3.8 6.8v10.4L12 21.8l8.2-4.6V6.8L12 2.2Zm0 2.3 6 3.4v8.2l-6 3.4-6-3.4V7.9l6-3.4Z" />
        </svg>
      )
    case 'postgresql':
      return (
        <svg {...common}>
          <path d="M12 2c-3.5 0-6 1.6-6 4.2v7.2c0 1.4.6 2.6 1.6 3.4-.2.6-.4 1.5-.8 2.3-.3.6.2 1.2.8 1l1.6-.6c.5 0 1 .2 1.4.5 1 .7 2.2 1 3.4 1s2.4-.3 3.4-1c.4-.3.9-.5 1.4-.5l1.6.6c.6.2 1.1-.4.8-1-.4-.8-.6-1.7-.8-2.3 1-.8 1.6-2 1.6-3.4V6.2C18 3.6 15.5 2 12 2Zm0 2c2.4 0 4 .9 4 2.2S14.4 8.4 12 8.4 8 7.5 8 6.2 9.6 4 12 4Z" />
        </svg>
      )
    case 'supabase':
      return (
        <svg {...common}>
          <path d="M13.6 2.2c.5-.8 1.7-.4 1.7.6v7.6h5.1c.9 0 1.4 1.1.7 1.8l-8.7 9.6c-.5.6-1.5.2-1.5-.6v-7.6H5.8c-.9 0-1.4-1.1-.7-1.8l8.5-9.6Z" />
        </svg>
      )
    case 'sanity':
      return (
        <svg {...common}>
          <path d="M7.2 4.5c1.2-.9 3-.9 4.6-.5 1.4.4 2.4 1.2 2.4 2.5 0 1.5-1 2.3-2.6 2.9l-2.2.8c-.8.3-1.1.6-1.1 1.1 0 .6.6 1 1.6 1 1.1 0 2.2-.4 3.2-1l.7 1.8c-1.1.7-2.6 1.1-4.1 1.1-1.9 0-3.4-.9-3.4-2.7 0-1.5.9-2.4 2.6-3l2.1-.8c.7-.3 1-.6 1-1.1 0-.5-.5-.9-1.4-.9-.9 0-1.9.3-2.8.8L7.2 4.5Zm8.2 4.2c.4-1.7 1.6-3 3.4-3.5l.5 1.9c-1 .3-1.6 1-1.8 2l4 .1-.2 1.9h-4.2c.1 1.3.8 2.2 2.1 2.6l-.6 1.9c-2.3-.6-3.6-2.2-3.9-4.5H12l.2-1.9h3.2Z" />
        </svg>
      )
    case 'zod':
      return (
        <svg {...common}>
          <path d="M4 5h16l-7 7 7 7H4v-2.4h10.2L8.4 12 14.2 7.4H4V5Z" />
        </svg>
      )
    case 'claude':
      return (
        <svg {...common}>
          <path d="M12.8 3.2 15 9.4l5.8.4-4.5 3.8 1.5 5.8L12 16.4l-5.8 3 1.5-5.8L3.2 9.8l5.8-.4 2.2-6.2.8 0Zm-.8 3.4-1.3 3.6-3.4.2 2.6 2.2-.9 3.4 3-1.6 3 1.6-.9-3.4 2.6-2.2-3.4-.2L12 6.6Z" />
        </svg>
      )
    case 'aisdk':
      return (
        <svg {...common}>
          <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.2 6.8 3.8v1.7L12 13.4 5.2 9.7V8L12 4.2ZM5.2 11.8l5.8 3.2v4.3l-5.8-3.2v-4.3Zm7.8 7.5v-4.3l5.8-3.2v4.3l-5.8 3.2Z" />
        </svg>
      )
    case 'openai':
      return (
        <svg {...common}>
          <path d="M12.4 3.1a4.2 4.2 0 0 1 3.7 2.1 4.2 4.2 0 0 1 4.5 4.1c0 .4 0 .8-.1 1.1a4.2 4.2 0 0 1-1.6 7.4 4.2 4.2 0 0 1-3.7 2.1 4.2 4.2 0 0 1-3.7-2.1 4.2 4.2 0 0 1-4.5-4.1c0-.4 0-.8.1-1.1A4.2 4.2 0 0 1 8.7 5.2a4.2 4.2 0 0 1 3.7-2.1Zm0 1.6c-.7 0-1.4.3-1.8.9l-.3.4-.4-.1a2.6 2.6 0 0 0-2.9 2.4c0 .3 0 .5.1.8l.1.4-.3.3a2.6 2.6 0 0 0 1 4.4l.5.1.2.4a2.6 2.6 0 0 0 4.5 1.1l.3-.4.4.1a2.6 2.6 0 0 0 2.9-2.4c0-.3 0-.5-.1-.8l-.1-.4.3-.3a2.6 2.6 0 0 0-1-4.4l-.5-.1-.2-.4a2.6 2.6 0 0 0-2.7-1.5Z" />
        </svg>
      )
    case 'gemini':
      return (
        <svg {...common}>
          <path d="M12 2c.4 4.2 1.8 7.2 4.8 9.2C13.8 13.2 12.4 16.2 12 20.4 11.6 16.2 10.2 13.2 7.2 11.2 10.2 9.2 11.6 6.2 12 2Zm7.5 5.5c.2 2.1.9 3.6 2.4 4.6-1.5 1-2.2 2.5-2.4 4.6-.2-2.1-.9-3.6-2.4-4.6 1.5-1 2.2-2.5 2.4-4.6ZM4.5 7.5c.2 2.1.9 3.6 2.4 4.6-1.5 1-2.2 2.5-2.4 4.6-.2-2.1-.9-3.6-2.4-4.6 1.5-1 2.2-2.5 2.4-4.6Z" />
        </svg>
      )
    case 'playwright':
      return (
        <svg {...common}>
          <path d="M4 6.5 12 3l8 3.5v7.2c0 3.8-3.2 6.8-8 8.3-4.8-1.5-8-4.5-8-8.3V6.5Zm2 1.2v6c0 2.6 2.2 4.8 6 5.9 3.8-1.1 6-3.3 6-5.9v-6L12 5.2 6 7.7Zm3.2 2.6h5.6v1.6H9.2V10.3Zm0 3h5.6v1.6H9.2v-1.6Z" />
        </svg>
      )
    case 'git':
      return (
        <svg {...common}>
          <path d="M21.6 11.1 12.9 2.4a1.4 1.4 0 0 0-2 0L9.2 4.1l2.5 2.5a1.7 1.7 0 0 1 2.1 2.1l2.4 2.4a1.7 1.7 0 1 1-1 1l-2.4-2.4v6.3a1.7 1.7 0 1 1-1.3.1V9.7a1.7 1.7 0 0 1-.9-2.2L6.1 5.1 2.4 8.8a1.4 1.4 0 0 0 0 2l8.7 8.7a1.4 1.4 0 0 0 2 0l8.5-8.5a1.4 1.4 0 0 0 0-2Z" />
        </svg>
      )
    case 'vercel':
      return (
        <svg {...common}>
          <path d="M12 3 22 20H2L12 3Z" />
        </svg>
      )
    case 'figma':
      return (
        <svg {...common}>
          <path d="M8.5 2.5A3.5 3.5 0 0 0 5 6v.5A3.5 3.5 0 0 0 8.5 10H12V2.5H8.5Zm3.5 7.5H8.5A3.5 3.5 0 1 0 12 14.5V10Zm0 4.5A3.5 3.5 0 1 0 15.5 18 3.5 3.5 0 0 0 12 14.5Zm0-4.5h3.5A3.5 3.5 0 1 0 12 6.5V10Zm3.5-7.5H12V10h3.5A3.5 3.5 0 1 0 15.5 2.5Z" />
        </svg>
      )
    case 'teller':
      return (
        <svg {...common}>
          <path d="M3 7.5 12 3l9 4.5V11H3V7.5ZM5 13h2v6H5v-6Zm4 0h2v6H9v-6Zm4 0h2v6h-2v-6Zm4 0h2v6h-2v-6ZM3 21h18v-1.5H3V21Z" />
        </svg>
      )
    case 'recharts':
      return (
        <svg {...common}>
          <path d="M4 19V5h2v12h14v2H4Zm4-3V11h2v5H8Zm4 0V7h2v9h-2Zm4 0v-3h2v3h-2Z" />
        </svg>
      )
    default:
      return null
  }
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
  },
}

export function SkillsSection() {
  const total = SKILL_GROUPS.reduce((n, g) => n + g.skills.length, 0)

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h2 className="text-3xl sm:text-4xl font-light font-sora tracking-tight">Skills & Expertise</h2>
        <div className="text-sm text-muted-foreground font-mono">STACK / {total}</div>
      </div>

      <div className="grid gap-10 sm:gap-12">
        {SKILL_GROUPS.map((group) => (
          <div key={group.label} className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 border-b border-border/50 pb-3">
              <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-foreground">
                {group.label}
              </h3>
              <p className="text-sm text-muted-foreground">{group.blurb}</p>
            </div>

            <motion.ul
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {group.skills.map((skill) => (
                <motion.li
                  key={skill.id}
                  variants={item}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className="group relative flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 rounded-xl border border-border/50 bg-background/40 hover:border-foreground/35 hover:bg-accent/25 transition-colors duration-300 cursor-default"
                >
                  <span
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-muted-foreground overflow-hidden group-hover:text-foreground group-hover:border-foreground/40 transition-colors"
                    aria-hidden
                  >
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-foreground/10 via-transparent to-transparent" />
                    <motion.span className="relative" whileHover={{ rotate: [-2, 2, 0] }} transition={{ duration: 0.45 }}>
                      <SkillIcon id={skill.id} />
                    </motion.span>
                  </span>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {skill.name}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        ))}
      </div>
    </div>
  )
}
