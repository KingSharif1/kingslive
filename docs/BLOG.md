# Blog + Sanity

## How it works

1. Write in **Sanity Studio** at `/studio` (or Sanity-hosted studio for project `n31jvc6a`).
2. Public site reads via `lib/sanity-queries.ts` → CDN client in `lib/sanity.ts`.
3. Homepage “Latest from the Blog” and `/blog` share the same query helpers.
4. **Visuals are not shared.** `/` is glass + numbered rows. `/blog` is **Cerebration** (`blog-world`): mobile-first. On phones the index is a catalog list — full-width rows (cloth swatch, tag, full title, date, excerpt) grouped by year, no popups; on `md+` it becomes "The Library" — posts as cloth-bound book spines on wooden shelves grouped by year (brass year plates), hover/focus opens a viewport-clamped inspector card portaled to `document.body` (cover, excerpt, Open + like) so it can never clip. Each post page is "the old book" — the title page sits on the blank top of the sheet (ruled lines begin below it on `.blog-ruled`), with a hand-drawn marker stroke that draws itself under the title and a highlighter wash behind the excerpt words. Body content snaps to a baseline grid (every block is a whole multiple of `--blog-line`) and every text line's baseline is nudged onto the nearest ruled line — like handwriting on paper. Body copy is Alegreya (normal + italic via next/font, Georgia fallback). Photo captions sit snug under their photos (small fixed margin-top) and are excluded from the baseline nudge. Big headings (h1–h3) get a solid paper backing that hides the ruled lines behind the heading block, plus a rule-colored `text-decoration: underline` (1px, 4px offset) that redraws one thin line under each wrapped line of text — every heading line sits on a line, none cross the glyphs. (A per-line paper mask via `box-decoration-break: clone` was tried first but depended on exact font ascent/descent metrics; the underline approach is metric-independent.) The nudge is measured per element at runtime (real font ascent via canvas, `app/blog/[slug]/page.tsx` baseline effect): padding-top grows while margin-bottom shrinks by the same amount, so each block's footprint stays grid-exact. The effect is idempotent — every run recomputes from the original padding/margin stored on first touch, so image loads, resizes, and FAQ toggles never stack shifts. It is scoped to the article only (`.prose`, tags, footnotes, fin); the like-bar and comments are never touched. Photos (whose heights come from aspect ratios) get their bottom margin snapped so the next block lands back on the grid. Previously un-snapped blocks — h1/h5/h6, tables, FAQs, code blocks, callouts — are now grid multiples too. Single faint margin rule tucked in the gutter (clear of the text), tightened vertical rhythm (`--blog-line: 1.6rem`), drop cap, aged-paper vignette, ❦ divider above footnotes, "Fin." colophon. Both pages end in `BlogFooter` — kicker, Library/Portfolio/X/Instagram/GitHub links, the giant outlined `cerebration` wordmark (animates in letter-by-letter on scroll via pure CSS `animation-timeline: view()`, visible fallback), copyright + back-to-top, over a canvas ember field. The canvas paints its own fade (transparent → tone, no hard edge) and is theme-adaptive: glowing embers on near-black in dark mode, warm sparks on paper in light mode (theme detected via `html.dark` / `.blog-world.dark` with a MutationObserver). Perf: single rAF loop, sprite-based rendering (one pre-rendered glow sprite per hue, one drawImage per ember), delta-time motion, particle count scales with width, DPR capped at 1.5, pauses off-screen via IntersectionObserver, one static frame under `prefers-reduced-motion`. Embers dissolve over the top ~140px so they never pop at the edge. Zero assets. `Cerebration` → `/blog`. `Home` → `/`. Posts use `BlogNav`, not the portfolio `Header`.

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

## Handwriting pass (2026-09-28, local — uncommitted)

User picked **Caveat** as the handwriting font (`next/font/google`, weights 400/500/600/700,
`--font-caveat` registered on `<body>` in `app/layout.tsx`).

- `--font-note` now resolves to Caveat first (fallback `'Segoe Print', 'Bradley Hand', cursive`).
- Article sheet: `width: min(88%, 100rem)` (the requested 73–90% viewport band), `--blog-line: 2rem`.
- Article prose: Caveat 500 at `1.5rem`; h1–h3, title-page title, and the opening drop cap use the
  handwriting font. Captions bumped to `1.3rem`/`1.15rem` so Caveat stays legible.
- Photos keep their **natural aspect ratio** — the Roomba post's source shots are mostly 3:4
  portrait, so the earlier uniform 16:10 crop was cutting them in half and has been reverted.
  Consistency comes from the taped polaroid frame (same padding/tape/shadow, `54rem` max width,
  centered); single photos cap at `40rem` tall so portraits stay bookish, never towering.
  Multi-photo cells use a gentle `4/5` frame suited to the portrait source shots.
- ❦ ornaments removed everywhere: title page and sources use `.blog-handline` (hand-drawn wavy
  marker line via SVG mask); the `Fin` colophon is now the word "Fin" in Caveat inside a sketchy
  double hand-drawn frame (`.blog-fin__frame`).
- Post pages: `BlogFooter` removed from `/blog/[slug]` (footer now index-only).
  - Desktop gets a fixed left rail (`.blog-rail`): vertical brand, Library/Home links, Like /
    Comment / Share actions. Comment scrolls to `#comments` and fires `open-comments`.
  - Mobile gets a fixed bottom action bar (`.blog-bottombar`): Home, Like, Comment, Share.
  - The large article-bottom LikeButton was removed (like now lives in the rail/bar).
- Comments are **name + comment only** — email state, validation, and field removed from
  `Comments.tsx`. Insert omits `author_email`; the TS interfaces now type it as optional
  (`author_email?: string | null`). **Before shipping:** confirm `blog_comments.author_email`
  is nullable (or has a default) in Supabase — if it is `NOT NULL`, comment submission will
  fail. Moderation/auto-approve logic untouched.
- Blog index: background + footer wordmark now uppercase `CEREBRATION`; header copy is
  "A builder's notebook: projects, breakdowns, and lessons, shelved as I go. Pull one down.";
  search + subjects merged into one toolbar with pill filters (`count` per subject, sorted by
  count). `tagCounts` replaced `allTags`.
- Footer is a **pond** (`BlogFooter.tsx` rewritten): full-footer pond canvas (water
  gradient, drifting caustics, pebbles, reeds) with no fish — tap/click the water
  for expanding ripple rings. The wordmark is two layers — back layer (`z-index: 1`,
  dimmed, under the water) and front layer (`z-index: 3`, only even-index letters
  visible). Theme-adaptive palettes, DPR capped at 1.5, pauses off-screen via
  IntersectionObserver, single static frame under `prefers-reduced-motion`.
  Zero assets.
- `BackToTop` (`components/blog/BackToTop.tsx`): floating button appears after ~10% page scroll
  (and 240px min), used on the index and post pages.
- Ctroom `BlogView`: now loads via `getAllPostsForAdmin()` — drafts included, ordered by
  `_updatedAt`; each row shows "updated {date}". `BlogPost.updated_at` projected from Sanity
  `_updatedAt` (last document write, not full revision history). Note: an older
  `getAllPosts(): Promise<SanityPost[]>` (raw docs) still exists for other callers — do not
  confuse the two.
- **Firefox ruled-lines bug (found + fixed 2026-09-28):** the `.blog-ruled`
  `repeating-linear-gradient` used `color-mix(in srgb, var(--blog-rule) 38%, transparent)` for
  the 1px line color. Firefox renders `color-mix()` **inverted inside gradients** — thick gray
  bands with hairline paper gaps instead of thin rules on paper (verified with a minimal repro:
  literal `color-mix(in srgb, #7a9ab8 38%, transparent)` also breaks; hardcoded `rgba()` and
  relative-color syntax render correctly). The gradient now uses
  `rgb(from var(--blog-rule) r g b / 38%)` — identical 38%-alpha line color, correct in
  Firefox/Chrome/Safari. This bug predates the current changes (it was live on production for
  Firefox visitors). Lesson: never use `color-mix()` for a color stop inside a gradient.
- **Library filter → broad shelves (2026-09-28, uncommitted):** the 15 per-tag pills
  (nearly all count 1) were replaced with 5 fixed shelves — Robots (Roomba, Robotics,
  Raspberry Pi, ROS 2, Arduino, SLAM), AI (AI, Tech), Code (Development, Next.js),
  Builds (Build Log, DIY, Portfolio), Life (Dev Life). `SHELVES` maps shelf → tags in
  `app/blog/page.tsx`; a post matches every shelf containing one of its tags. Legacy
  `?tag=` URLs still work — a raw tag resolves to its shelf. Label changed
  "Subjects" → "Shelves".
- **CEREBRATION wordmark is 100% viewport width (2026-09-28, uncommitted):** the index
  background wordmark (was 120vw, cropped) and the footer wordmark (was 17.5vw,
  overflowing) are now inline SVGs with `textLength` + `lengthAdjust="spacing"`, so the
  full word always spans the container width on any screen. Both break out of their
  padded containers (`width: 100vw; margin-left: calc(50% - 50vw)`) so the word runs
  truly edge-to-edge — measured 0→1440 on a 1440px viewport. Header and footer both
  have `overflow: hidden`, so no horizontal scrollbar. Footer keeps its two
  layers (back = full word under the water, front = even-index letters above) via
  `<tspan>`s with preserved spacing so both layers align exactly; the wordstage uses
  `display: flow-root` so the layers' margins can't collapse apart. Hover fill now
  targets SVG `fill` instead of `color`.
- **Footer pond rebuilt to match the X reference (2026-09-28, uncommitted):**
  inspected the actual reference (x.com/zzzzshawn "Koi fish pond", shwn.design) —
  correction: the video shows the pond as a page *hero*, not a footer wordmark, so
  the fish-between-letterforms idea was a misremembering. Rebuilt `BlogFooter.tsx`
  from the verified details: top-down deep-emerald water (darker middle, lighter
  teal edges, feathered top edge into the page), a dancing caustic-light web
  (pre-rendered sine-interference frames, crossfaded, screen-blended), smooth
  pebbles with algae tint + grass blades visible beneath the semi-clear water,
  5–6 painterly koi (solid orange / golden+black / white+orange-red /
  orange+white) with undulating segmented bodies, forked translucent tails and
  pectoral fins, slow wandering with edge steering. Interactions: tap water →
  expanding concentric ripple rings; tap near a fish → it darts away and the
  school scatters, then regroups. Kept the fitted two-layer CEREBRATION wordmark
  (back layer reads as letters on the pond floor through the water). DPR ≤ 1.5,
  IntersectionObserver pause, prefers-reduced-motion keeps the pond still except
  for touch ripples.
- **Mountains footer (2026-09-28, uncommitted):** at his request the pond was
  removed entirely — he wanted it simple, no interactive stuff. The footer is
  now a quiet animated **mountain scene**: two SVG ridge layers drifting slowly
  (seamless -50% loop, pure CSS, no canvas), a glowing moon/sun disc, twinkling
  stars in dark mode, and — since he loved dark mode as-is — a light-mode-only
  **wind**: soft drifting clouds plus thin wind streaks (hidden in dark mode via
  CSS). The CEREBRATION wordmark became a **news ticker**: the word repeated
  with ✦ separators, scrolling left → right in a seamless -50% → 0 loop inside
  a full-viewport band with hairline rules (pauses on hover). Same simple
  content otherwise: kicker + links, copyright + back-to-top baseline (now with
  a soft sky-tone text-shadow so the small type stays readable over the ridges).
  Light/dark adaptive via --foot-* vars; static under prefers-reduced-motion.
  Zero assets. Note: the footer renders on the blog index only, not on post
  pages.
- **Fish removed; library letters + article parchment (2026-09-28, uncommitted):**
  per his feedback the koi were removed — the footer was briefly water only
  (caustics, pebbles, reeds, tap ripples), then the whole pond was replaced by
  the mountains footer above.
  The library's cloth book spines became **parchment letters**: aged-paper texture
  (`public/textures/parchment-letter.jpg`, generated from his reference photo),
  slight deterministic tilt, handwritten title (Caveat), small-caps tag, year,
  and a wax seal; they stand on the existing wooden shelf, grouped by year.
  Mobile catalog rows use the same parchment for their swatch. The article paper
  (`.blog-oldbook`) now layers a subtle paper texture
  (`public/textures/parchment-sheet.jpg`) under the aged-edge vignette, above the
  notebook rules. The red margin line moved from the full-page container to the
  paper itself (`.blog-read::before`, `top: 0; bottom: 0`) so it runs only with
  the content sheet, measured 388→16116 on a 16196px page. The library's
  book-spine hover inspector is unchanged (still shows cover, excerpt, Open +
  like); letter ARIA now says "open this letter".
- **Hover-inspector crash fix (2026-09-28, uncommitted):** hovering a letter for a
  post *with* a cover image crashed the whole page ("Application error") —
  the inspector's `<Image quality={70}>` isn't in `next.config.js`
  `images.qualities` ([75, 85]). Changed to `quality={75}`. Pre-existing bug,
  found while verifying the letter hover.
