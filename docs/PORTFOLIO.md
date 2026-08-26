# Portfolio projects (public site + CTROOM)

## How it works

| Layer | Source |
|-------|--------|
| Public homepage | Supabase `portfolio_projects` (published rows), else static seed |
| CTROOM → Portfolio | Full CRUD: GitHub link, website, cover image, skills, Featured, Deployed/In Progress |
| Seed data | `lib/portfolio-projects.ts` (HireIQ docs, 1942 README, GitHub descriptions) |

## One-time setup

1. Supabase project **kinglive cms** → SQL Editor  
2. Run `supabase/migrations/20260826_create_portfolio_projects.sql`  
3. CTROOM → **Portfolio** → **Seed defaults**  
4. Edit projects as needed (covers upload to Storage bucket `images` / `portfolio/`)

## Fields

- `id` — stable slug (Sanity `relatedProjectId`)
- `title`, `year`, `status` (`Deployed` | `In Progress`)
- `description`, `tech[]`
- `live_url`, `repo_url`, `blog_slug`
- `image` — `/public/...` or Supabase Storage URL
- `featured` — top section vs archive dropdown
- `sort_order`, `published`

## Featured vs archive

Featured projects appear in the main list (aim for 3). Non-featured go under **All projects** dropdown.
