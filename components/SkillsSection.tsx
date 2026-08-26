'use client'

import { motion } from 'framer-motion'

type SkillId =
  | 'react'
  | 'nextjs'
  | 'typescript'
  | 'tailwind'
  | 'nodejs'
  | 'postgresql'
  | 'supabase'
  | 'graphql'
  | 'git'
  | 'docker'
  | 'aws'
  | 'figma'

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
    blurb: 'Interfaces that feel fast and intentional.',
    skills: [
      { id: 'react', name: 'React' },
      { id: 'nextjs', name: 'Next.js' },
      { id: 'typescript', name: 'TypeScript' },
      { id: 'tailwind', name: 'Tailwind' },
    ],
  },
  {
    label: 'Backend & Data',
    blurb: 'APIs, auth, and stores that hold up.',
    skills: [
      { id: 'nodejs', name: 'Node.js' },
      { id: 'postgresql', name: 'PostgreSQL' },
      { id: 'supabase', name: 'Supabase' },
      { id: 'graphql', name: 'GraphQL' },
    ],
  },
  {
    label: 'Product & Ops',
    blurb: 'Shipping, design systems, and cloud.',
    skills: [
      { id: 'git', name: 'Git' },
      { id: 'docker', name: 'Docker' },
      { id: 'aws', name: 'AWS' },
      { id: 'figma', name: 'Figma' },
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
          <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            transform="rotate(60 12 12)"
          />
          <ellipse
            cx="12"
            cy="12"
            rx="10"
            ry="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            transform="rotate(120 12 12)"
          />
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
    case 'nodejs':
      return (
        <svg {...common}>
          <path d="M12 2.2 3.8 6.8v10.4L12 21.8l8.2-4.6V6.8L12 2.2Zm0 2.3 6 3.4v8.2l-6 3.4-6-3.4V7.9l6-3.4Zm-.9 4.2h1.8v5.4c0 1.4-.7 2.2-2.1 2.2-.5 0-1.1-.1-1.5-.3l.3-1.4c.2.1.5.2.8.2.5 0 .7-.2.7-.7V8.7Zm3.2 0h3.7v1.5h-1.9v1.4h1.7v1.4h-1.7v2.6h-1.8V8.7Z" />
        </svg>
      )
    case 'postgresql':
      return (
        <svg {...common}>
          <path d="M16.8 3.2c-1.2-.4-2.6-.5-3.8-.3-.6-1-1.5-1.7-2.7-1.7-2 0-2.9 1.7-3.2 3.4-1.4.4-2.4 1.2-2.9 2.4-.9 2 .1 4.4 1.4 5.8.4.4.5 1 .3 1.5l-.6 1.7c-.2.5.3 1 .8.8l1.8-.6c.4-.1.9 0 1.2.3 1 .8 2.3 1.2 3.6 1.1v.8c0 .6.5 1.1 1.1 1.1s1.1-.5 1.1-1.1v-1.5c1.4-.3 2.6-1.1 3.3-2.3 1.3-2.2.7-5.2-.4-6.8-.4-.6-.4-1.3-.1-1.9.5-1.1.6-2.3.1-3.7Zm-5.2 13.2c-1.1.1-2.2-.2-3.1-.8-.2-.1-.4-.2-.6-.1l-1.2.4.3-.9c.1-.4.1-.8-.1-1.1C5.7 12.6 5 10.8 5.5 9.5c.3-.8 1.1-1.4 2.2-1.7.3-.1.5-.3.6-.6.3-1.2.9-2.5 2.1-2.5.5 0 1 .3 1.3.9.1.3.4.4.7.4 1.2-.1 2.5 0 3.5.4-.1.8-.2 1.6-.6 2.3-.2.4-.2.8 0 1.2.9 1.3 1.4 3.6.4 5.2-.5.9-1.5 1.5-2.7 1.8v-.7c0-.3-.1-.5-.3-.6-.2-.1-.5-.1-.7 0l-.3.1v.9Z" />
        </svg>
      )
    case 'supabase':
      return (
        <svg {...common}>
          <path d="M13.6 2.2c.5-.8 1.7-.4 1.7.6v7.6h5.1c.9 0 1.4 1.1.7 1.8l-8.7 9.6c-.5.6-1.5.2-1.5-.6v-7.6H5.8c-.9 0-1.4-1.1-.7-1.8l8.5-9.6Z" />
        </svg>
      )
    case 'graphql':
      return (
        <svg {...common}>
          <path d="M4.4 16.1 12 3l7.6 13.1H4.4Zm1.9-1.4h11.4L12 5.9 6.3 14.7ZM4 17.4h16v1.6H4v-1.6Zm2.4 2.2h11.2v1.6H6.4v-1.6Z" />
          <circle cx="12" cy="4.2" r="1.4" />
          <circle cx="4.8" cy="16.8" r="1.4" />
          <circle cx="19.2" cy="16.8" r="1.4" />
        </svg>
      )
    case 'git':
      return (
        <svg {...common}>
          <path d="M21.6 11.1 12.9 2.4a1.4 1.4 0 0 0-2 0L9.2 4.1l2.5 2.5a1.7 1.7 0 0 1 2.1 2.1l2.4 2.4a1.7 1.7 0 1 1-1 1l-2.4-2.4v6.3a1.7 1.7 0 1 1-1.3.1V9.7a1.7 1.7 0 0 1-.9-2.2L6.1 5.1 2.4 8.8a1.4 1.4 0 0 0 0 2l8.7 8.7a1.4 1.4 0 0 0 2 0l8.5-8.5a1.4 1.4 0 0 0 0-2Z" />
        </svg>
      )
    case 'docker':
      return (
        <svg {...common}>
          <path d="M4.4 12.2h2.1v2H4.4v-2Zm2.6 0h2.1v2H7v-2Zm2.6 0h2.1v2H9.6v-2Zm2.6 0h2.1v2h-2.1v-2ZM7 9.7h2.1v2H7v-2Zm2.6 0h2.1v2H9.6v-2Zm2.6 0h2.1v2h-2.1v-2Zm0-2.5h2.1v2h-2.1v-2ZM4.1 15.4c-.2 1.2.2 2.4 1.8 3.1 1.4.6 4 .8 6.1.4 0 0 .7 1.6 2.8 1.4 2-.1 3-.9 3.5-2.1.8.1 2.1-.1 2.6-1.1.2-.5.2-1.1 0-1.6H4.1Z" />
        </svg>
      )
    case 'aws':
      return (
        <svg {...common}>
          <path d="M7.2 14.1c0 .4.1.7.3.9.2.2.5.4.9.5l1.5.4c.2.1.4.1.5.2s.2.2.2.4-.1.3-.3.4c-.2.1-.5.2-.9.2-.5 0-1-.1-1.4-.3l-.5-.2-.3 1.3.4.2c.6.3 1.3.4 2.1.4 1 0 1.8-.2 2.4-.7.6-.4.9-1 .9-1.8 0-.4-.1-.8-.3-1.1-.2-.3-.6-.6-1.1-.8l-1.5-.4c-.4-.1-.6-.2-.7-.3-.1-.1-.1-.3-.1-.4 0-.2.1-.3.3-.4.2-.1.5-.2.9-.2.4 0 .8.1 1.2.2l.4.2.3-1.3-.4-.2c-.5-.2-1.2-.3-1.9-.3-.9 0-1.7.2-2.2.7-.5.4-.8 1-.8 1.7Zm5.4-.1 1.6 5.1h1.6l2.3-7.4h-1.6l-1.4 4.9-1.4-4.9h-1.6l.5 2.3Zm10.5 2.7c0-.9-.3-1.6-.8-2.1-.5-.5-1.3-.8-2.2-.8-.9 0-1.6.3-2.1.8-.5.5-.8 1.2-.8 2.1s.3 1.6.8 2.1c.5.5 1.3.8 2.1.8.5 0 1-.1 1.4-.3l.4-.2-.3-1.2-.5.2c-.3.1-.6.2-.9.2-.5 0-.8-.1-1.1-.4-.3-.3-.4-.6-.4-1.1h4.4v-.2Zm-4.4-.8c.1-.4.2-.7.5-.9.2-.2.5-.3.9-.3s.6.1.9.3c.2.2.4.5.5.9h-2.8ZM6.4 19.2c-2.5-1.1-4.1-2.7-4.8-4.7l1.4-.6c.5 1.6 1.8 2.9 3.9 3.8l-.5 1.5Zm11.2 0-.5-1.5c2.1-.9 3.4-2.2 3.9-3.8l1.4.6c-.7 2-2.3 3.6-4.8 4.7Z" />
        </svg>
      )
    case 'figma':
      return (
        <svg {...common}>
          <path d="M8.5 2.5A3.5 3.5 0 0 0 5 6v.5A3.5 3.5 0 0 0 8.5 10H12V2.5H8.5Zm3.5 7.5H8.5A3.5 3.5 0 1 0 12 14.5V10Zm0 4.5A3.5 3.5 0 1 0 15.5 18 3.5 3.5 0 0 0 12 14.5Zm0-4.5h3.5A3.5 3.5 0 1 0 12 6.5V10Zm3.5-7.5H12V10h3.5A3.5 3.5 0 1 0 15.5 2.5Z" />
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
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
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
  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h2 className="text-3xl sm:text-4xl font-light font-sora tracking-tight">Skills & Expertise</h2>
        <div className="text-sm text-muted-foreground font-mono">STACK / 12</div>
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
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
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
                    <motion.span
                      className="relative"
                      whileHover={{ rotate: [-2, 2, 0] }}
                      transition={{ duration: 0.45 }}
                    >
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
