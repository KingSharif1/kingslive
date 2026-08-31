'use client'

import { motion } from 'framer-motion'

type SkillId =
  | 'react'
  | 'reactnative'
  | 'nextjs'
  | 'typescript'
  | 'tailwind'
  | 'framer'
  | 'vite'
  | 'threejs'
  | 'shadcn'
  | 'wordpress'
  | 'nodejs'
  | 'postgresql'
  | 'neon'
  | 'supabase'
  | 'strapi'
  | 'stripe'
  | 'sanity'
  | 'zod'
  | 'claude'
  | 'openai'
  | 'xai'
  | 'gemini'
  | 'groq'
  | 'git'
  | 'github'
  | 'aws'
  | 'vercel'
  | 'cursor'
  | 'windsurf'
  | 'antigravity'
  | 'figma'
  | 'playwright'
  | 'teller'

type Skill = {
  id: SkillId
  name: string
  slug: string
  src?: string
  invertDark?: boolean
}

type SkillGroup = {
  label: string
  hint: string
  skills: Skill[]
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    label: 'Frontend',
    hint: 'Product UI',
    skills: [
      { id: 'react', name: 'React', slug: 'react/61DAFB' },
      { id: 'reactnative', name: 'React Native', slug: 'react/61DAFB' },
      { id: 'nextjs', name: 'Next.js', slug: 'nextdotjs/000000', invertDark: true },
      { id: 'typescript', name: 'TypeScript', slug: 'typescript/3178C6' },
      { id: 'tailwind', name: 'Tailwind', slug: 'tailwindcss/06B6D4' },
      { id: 'framer', name: 'Framer Motion', slug: 'framer/0055FF' },
      { id: 'threejs', name: 'Three.js', slug: 'threedotjs/000000', invertDark: true },
      { id: 'vite', name: 'Vite', slug: 'vite/646CFF' },
      { id: 'shadcn', name: 'shadcn/ui', slug: '' },
      { id: 'wordpress', name: 'WordPress', slug: 'wordpress/21759B' },
    ],
  },
  {
    label: 'Backend',
    hint: 'Data',
    skills: [
      { id: 'nodejs', name: 'Node.js', slug: 'nodedotjs/5FA04E' },
      { id: 'postgresql', name: 'PostgreSQL', slug: 'postgresql/4169E1' },
      { id: 'neon', name: 'Neon', slug: 'neon/00E599' },
      { id: 'supabase', name: 'Supabase', slug: 'supabase/3FCF8E' },
      { id: 'strapi', name: 'Strapi', slug: 'strapi/4945FF' },
      { id: 'stripe', name: 'Stripe', slug: 'stripe/008CDD' },
      { id: 'sanity', name: 'Sanity', slug: 'sanity/F03E2F' },
      { id: 'zod', name: 'Zod', slug: 'zod/3E67B1' },
    ],
  },
  {
    label: 'AI',
    hint: 'Models',
    skills: [
      { id: 'claude', name: 'Claude', slug: 'anthropic/191919', invertDark: true },
      {
        id: 'openai',
        name: 'OpenAI',
        slug: '',
        src: 'https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/openai.svg',
        invertDark: true,
      },
      { id: 'xai', name: 'xAI', slug: '' },
      { id: 'gemini', name: 'Gemini', slug: 'googlegemini' },
      { id: 'groq', name: 'Groq', slug: '' },
    ],
  },
  {
    label: 'Tools',
    hint: 'Editors',
    skills: [
      { id: 'git', name: 'Git', slug: 'git/F05032' },
      { id: 'github', name: 'GitHub', slug: 'github/181717', invertDark: true },
      { id: 'cursor', name: 'Cursor', slug: 'cursor' },
      { id: 'windsurf', name: 'Windsurf', slug: 'windsurf' },
      { id: 'antigravity', name: 'Antigravity', slug: '' },
      { id: 'aws', name: 'AWS', slug: '' },
      { id: 'vercel', name: 'Vercel', slug: 'vercel/000000', invertDark: true },
      { id: 'figma', name: 'Figma', slug: 'figma/F24E1E' },
      { id: 'playwright', name: 'Playwright', slug: '' },
      { id: 'teller', name: 'Teller', slug: '' },
    ],
  },
]

function SkillMark({ skill }: { skill: Skill }) {
  if (skill.id === 'shadcn') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M4 3h7.5v7.5H4V3Zm9.5 0H21v7.5h-7.5V3ZM4 13.5H11.5V21H4v-7.5Zm13.2 0 .8.8-6 6-.8-.8 6-6Zm2.3 2.3.8.8-6 6-.8-.8 6-6Z" />
      </svg>
    )
  }
  if (skill.id === 'reactnative') {
    return (
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://cdn.simpleicons.org/react/61DAFB" alt="" className="h-5 w-5 opacity-90" />
        <span className="pointer-events-none absolute -bottom-1 -right-1 rounded-[3px] bg-sky-500 px-0.5 text-[6px] font-bold leading-none text-white" aria-hidden>
          RN
        </span>
      </span>
    )
  }

  if (skill.id === 'groq') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M4 6h16v3H8v3h10v3H8v3h12v3H4V6Z" />
      </svg>
    )
  }

  if (skill.id === 'teller') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M3 7.5 12 3l9 4.5V11H3V7.5ZM5 13h2v6H5v-6Zm4 0h2v6H9v-6Zm4 0h2v6h-2v-6Zm4 0h2v6h-2v-6ZM3 21h18v-1.5H3V21Z" />
      </svg>
    )
  }

  if (skill.id === 'aws') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M6.8 16.5c2.1 1.6 5.1 2.4 8 2.4 2.1 0 4.3-.4 6.1-1.2.5-.2.2.3-.2.6-2.5 2.1-5.7 3.2-9.2 3.2-4.4 0-8.4-1.6-11.2-4.3-.4-.4.3-.7.8-.4 1.9.9 3.8 1.4 5.7 1.7Z" />
        <path d="M20.4 15.1c.3-.4.1-.9-.4-1.1l-.3-.1c-.3 0-.5.1-.7.3l-1.5 1.9c-.2.2 0 .4.3.3 1-.1 2-.4 2.6-1.3Z" />
      </svg>
    )
  }

  if (skill.id === 'xai') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M4 5h4.2l3.6 5.4L16.2 5H20l-6.1 8.4L20.4 19H16l-4-6.1L7.8 19H4l6.3-8.7L4 5Z" />
      </svg>
    )
  }

  if (skill.id === 'playwright') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <circle cx="8" cy="9" r="4" fill="#2EAD33" />
        <circle cx="16" cy="9" r="4" fill="#D65348" />
        <circle cx="12" cy="15.5" r="4" fill="#2B72E8" />
      </svg>
    )
  }

  if (skill.id === 'antigravity') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="12" cy="12" r="3.2" />
        <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="18.1" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="5.9" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (!skill.slug && !skill.src) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={skill.src || `https://cdn.simpleicons.org/${skill.slug}`}
      alt=""
      width={20}
      height={20}
      className={`h-5 w-5 ${skill.invertDark ? 'dark:invert' : ''}`}
    />
  )
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 420, damping: 28 },
  },
}

export function SkillsSection() {
  const total = SKILL_GROUPS.reduce((n, g) => n + g.skills.length, 0)

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h2 className="text-3xl sm:text-4xl font-light font-sora tracking-tight">Skills</h2>
        <div className="text-sm text-muted-foreground font-mono">STACK / {total}</div>
      </div>

      <div className="space-y-10">
        {SKILL_GROUPS.map((group) => (
          <div key={group.label} className="space-y-4">
            <div className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground">
                {group.label}
              </h3>
              <p className="text-sm text-muted-foreground">{group.hint}</p>
            </div>
            <motion.ul
              data-skills-rev="6"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
            >
              {group.skills.map((skill) => (
                <motion.li
                  key={skill.id}
                  variants={item}
                  whileHover={{ y: -3 }}
                  className="group flex items-center gap-3 px-3 py-3 rounded-xl border border-border/40 bg-background/30 hover:border-foreground/30 hover:bg-background/60 transition-colors duration-300"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] border border-border/50 group-hover:border-foreground/25 transition-colors">
                    <SkillMark skill={skill} />
                  </span>
                  <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
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
