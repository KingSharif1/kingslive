# Blog + Sanity

## How it works

1. Write in **Sanity Studio** at `/studio` (or Sanity-hosted studio for project `n31jvc6a`).
2. Public site reads via `lib/sanity-queries.ts` → CDN client in `lib/sanity.ts`.
3. Homepage “Latest from the Blog” and `/blog` share the same query helpers.

## Required env

```
NEXT_PUBLIC_SANITY_PROJECT_ID=n31jvc6a
NEXT_PUBLIC_SANITY_DATASET=production
```

Optional write token for drafts/preview: `SANITY_API_TOKEN`.

## Publishing checklist

For each post in Studio:
- [ ] Title + slug
- [ ] Excerpt (or leave blank — site auto-builds from body)
- [ ] `published` = true
- [ ] `publishedAt` set
- [ ] Categories for tags
- [ ] `relatedProjectId` if the post is about a portfolio project

## Project ↔ post linking

| Portfolio `id` | Use in Studio “Related project” |
|----------------|----------------------------------|
| `hireiq` | HireIQ |
| `kingslive` | KingsLive · CTROOM |
| `1942` | 1942: Truly Forgotten |
| `roomba-dashboard` | Roomba Dashboard |
| `nemt-billing` | NEMT Billing |
| `sweet-emporium` | My Sweet Emporium |

- From a **project**: “Posts about this” → `/blog?project=<id>`
- From a **post**: project chip → live site / projects section
- Optional hard link: set `blogSlug` on a `PortfolioProject` for a single canonical post

## Common failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| “No posts found” | Wrong project ID / empty dataset | Set env to `n31jvc6a` |
| Studio 404 | Route missing | Ensure `app/studio/[[...tool]]/page.tsx` |
| Post not found by slug | `published: false` or wrong slug | Toggle published; check slug.current |
| Empty excerpt cards | No excerpt + empty body text | Add excerpt or body paragraphs |
| Broken inline images | Wrong project in CDN URL | Fallbacks now use `n31jvc6a` |

## Legacy note

`app/api/blog/posts` still talks to Supabase `blog_posts`. The **public UI does not use it** — Sanity is canonical. Prefer Sanity for new content.
