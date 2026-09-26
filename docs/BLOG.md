# Blog + Sanity

## How it works

1. Write in **Sanity Studio** at `/studio` (or Sanity-hosted studio for project `n31jvc6a`).
2. Public site reads via `lib/sanity-queries.ts` → CDN client in `lib/sanity.ts`.
3. Homepage “Latest from the Blog” and `/blog` share the same query helpers.
4. **Visuals are not shared.** `/` is glass + numbered rows. `/blog` is **Cerebration** (`blog-world`): mobile-first. On phones the index is a catalog list — full-width rows (cloth swatch, tag, full title, date, excerpt) grouped by year, no popups; on `md+` it becomes "The Library" — posts as cloth-bound book spines on wooden shelves grouped by year (brass year plates), hover/focus opens a viewport-clamped inspector card portaled to `document.body` (cover, excerpt, Open + like) so it can never clip. Each post page is "the old book" — the title page sits on the blank top of the sheet (ruled lines begin below it on `.blog-ruled`), with a hand-drawn marker stroke that draws itself under the title and a highlighter wash behind the excerpt words. Body content snaps to a baseline grid (every block is a whole multiple of `--blog-line`) so each line of text sits *between* the ruled lines. Single faint margin rule tucked in the gutter (clear of the text), tightened vertical rhythm (`--blog-line: 1.6rem`), drop cap, aged-paper vignette, ❦ divider above footnotes, "Fin." colophon. Both pages end in `BlogFooter` — kicker, Library/Portfolio/X/Instagram/GitHub links, the giant outlined `cerebration` wordmark (animates in letter-by-letter on scroll via pure CSS `animation-timeline: view()`, visible fallback), copyright + back-to-top, over a canvas ember field. The canvas paints its own fade (transparent → tone, no hard edge) and is theme-adaptive: glowing embers on near-black in dark mode, warm sparks on paper in light mode (theme detected via `html.dark` / `.blog-world.dark` with a MutationObserver). Perf: single rAF loop, sprite-based rendering (one pre-rendered glow sprite per hue, one drawImage per ember), delta-time motion, particle count scales with width, DPR capped at 1.5, pauses off-screen via IntersectionObserver, one static frame under `prefers-reduced-motion`. Embers dissolve over the top ~140px so they never pop at the edge. Zero assets. `Cerebration` → `/blog`. `Home` → `/`. Posts use `BlogNav`, not the portfolio `Header`.

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

## Design — Cerebration (2026-09-26)

The blog is branded **Cerebration**. Two rooms, same `blog-world` tokens:

- **`/blog` — The Library** (`app/blog/page.tsx`): posts as cloth-bound book spines on wooden shelves grouped by year (brass plates). Spine height/width/color are deterministic from the post id (`hashStr`). Hover/focus lifts the book and shows a catalog card (cover thumb, tag, title, date, excerpt, Open + like). Latest post featured as an open book with a "Latest" stamp. Search + subject filters unchanged.
- **`/blog/[slug]` — The Old Book** (`app/blog/[slug]/page.tsx`): title page on blank paper (brand, ❦ ornaments, title + animated marker underline, highlighted excerpt, author · date · reading time); ruled notebook lines live on `.blog-ruled`, which wraps everything below the title page. Drop cap on the opening paragraph (`::first-letter`), aged-paper vignette over the sheet, ❦ divider above the footnotes, "Fin." colophon. Comments, likes, share, sidebar, scroll progress untouched.
- **Ambient layers** (`components/blog/`): `BlogDrift` — one lightweight canvas of drifting ink doodles + an occasional paper plane (pauses when hidden, static under reduced motion); `BlogCursor` — ink dot + trailing ring, fine pointers only, fades over inputs.
- Photos keep the taped polaroid treatment (`BlogPhotos.tsx`); external links auto-collect into "Sources & further reading."

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
