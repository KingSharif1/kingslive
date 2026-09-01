# Blog + Sanity

## How it works

1. Write in **Sanity Studio** at `/studio` (or Sanity-hosted studio for project `n31jvc6a`).
2. Public site reads via `lib/sanity-queries.ts` → CDN client in `lib/sanity.ts`.
3. Homepage “Latest from the Blog” and `/blog` share the same query helpers.
4. **Visuals are not shared.** `/` is glass + numbered rows. `/blog` is a notes room (`blog-world`: paper, bleed type, shelf volumes) — a journal of what King builds, does, and talks about. `King · Notes` → `/blog`. `Home` → `/`. Posts use `BlogNav`, not the portfolio `Header`.

## Required env

```
NEXT_PUBLIC_SANITY_PROJECT_ID=n31jvc6a
NEXT_PUBLIC_SANITY_DATASET=production
```

Optional write token for drafts/preview: `SANITY_API_TOKEN` (Viewer or Editor). Required for the Studio **Preview** tab to show unpublished drafts.

## Draft preview

1. Open `/studio` (localhost).
2. Click **Preview** next to Structure (top of Studio).
3. Open the post. The right side is the real `/blog/[slug]` page, including draft body.
4. If that 401s, add `SANITY_API_TOKEN` to `.env.local` and restart the dev server yourself.

The public `/blog/[slug]` URL still only shows published notes.

## Publishing checklist

For each post in Studio:
- [ ] Title + slug
- [ ] Excerpt (or leave blank — site auto-builds from body)
- [ ] `published` = true
- [ ] `publishedAt` set
- [ ] Categories for tags
- [ ] `relatedProjectId` if the post is about a portfolio project

## Body tools (tech notes)

In Studio, click **+** in the body:

| Insert | Use for |
|--------|---------|
| **Photos** | One image, or 2–3 side by side. Drag to reorder. Caption under, no border. |
| **Table** | Two columns (Pin / Signal, term / meaning). Hairline rows. Stored as `noteTable` — do not name a block `table` (Sanity reserves that). |
| **FAQ** | Question + answer rows. Renders as dropdowns on the site. |
| **Callout** | A margin note (left rule), not a colored card. |
| **Code Block** | Snippets with language + optional filename. |

Do **not** use **Image** or **Image row (legacy)** for new work — they stay so old posts still edit.

**FAQ already written as an H2 + paragraphs:** delete those blocks, insert **FAQ**, paste each question and answer into its own row. The public page will not auto-convert a heading named “FAQ”.

**Captions:** always under the image, serif, no box. If a photo looks boxed, it was inside a Callout — that is now a left rule, not a blue card.

## Project ↔ post linking

| Portfolio `id` | Use in Studio “Related project” |
|----------------|----------------------------------|
| `hireiq` | HireIQ |
| `kingslive` | KingsLive · CTROOM |
| `1942` | 1942: Truly Forgotten |
| `roomba-dashboard` | Roomba Dashboard |
| `dfwnemt` | NEMT Billing |
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
| “type table is not allowed by the schema” | `_type: table` is reserved by Studio’s Portable Text editor | Delete the red error block. Insert **Table** again (now `noteTable`). Hard-refresh `/studio` after schema compile. |

## Legacy note

`app/api/blog/posts` still talks to Supabase `blog_posts`. The **public UI does not use it** — Sanity is canonical. Prefer Sanity for new content.
