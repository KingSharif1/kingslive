'use client'

type Skill = {
  name: string
  mark: string
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
      { name: 'React', mark: 'Re' },
      { name: 'Next.js', mark: 'Nx' },
      { name: 'TypeScript', mark: 'TS' },
      { name: 'Tailwind', mark: 'Tw' },
    ],
  },
  {
    label: 'Backend & Data',
    blurb: 'APIs, auth, and stores that hold up.',
    skills: [
      { name: 'Node.js', mark: 'No' },
      { name: 'PostgreSQL', mark: 'Pg' },
      { name: 'Supabase', mark: 'Sb' },
      { name: 'GraphQL', mark: 'Gq' },
    ],
  },
  {
    label: 'Product & Ops',
    blurb: 'Shipping, design systems, and cloud.',
    skills: [
      { name: 'Git', mark: 'Gi' },
      { name: 'Docker', mark: 'Dk' },
      { name: 'AWS', mark: 'Aw' },
      { name: 'Figma', mark: 'Fi' },
    ],
  },
]

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

            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {group.skills.map((skill) => (
                <li
                  key={skill.name}
                  className="group relative flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 border border-border/50 bg-background/40 hover:border-foreground/35 hover:bg-accent/25 transition-all duration-300"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center font-mono text-[11px] tracking-wider text-muted-foreground border border-border/70 bg-muted/30 group-hover:text-foreground group-hover:border-foreground/40 transition-colors"
                    aria-hidden
                  >
                    {skill.mark}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {skill.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
