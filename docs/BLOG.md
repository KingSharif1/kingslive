# Blog + Sanity

## How it works

1. Write in **Sanity Studio** at `/studio` (or Sanity-hosted studio for project `n31jvc6a`).
2. Public site reads via `lib/sanity-queries.ts` → CDN client in `lib/sanity.ts`.
3. Homepage “Latest from the Blog” and `/blog` share the same query helpers.
4. **Visuals are not shared.** `/` is glass + numbered rows. `/blog` is **Cerebration** (`blog-world`): mobile-first. On phones the index is a catalog list — full-width rows (cloth swatch, tag, full title, date, excerpt) grouped by year, no popups; on `md+` it becomes "The Library" — posts as cloth-bound book spines on wooden shelves grouped by year (brass year plates), hover/focus opens a viewport-clamped inspector card portaled to `document.body` (cover, excerpt, Open + like) so it can never clip. Each post page is "the old book" — the title page sits on the blank top of the sheet (ruled lines begin below it on `.blog-ruled`), with a hand-drawn marker stroke that draws itself under the title and a highlighter wash behind the excerpt words. Body content snaps to a baseline grid (every block is a whole multiple of `--blog-line`) and every text line's baseline is nudged to float just above the nearest ruled line — like ink resting on notebook paper, the words sit straight above the lines and no rule ever strikes through them. Body copy is Alegreya (normal + italic via next/font, Georgia fallback). Photo captions sit snug under their photos (small fixed margin-top) and are excluded from the baseline nudge. Big headings (h1–h3) get a solid paper backing that hides the ruled lines behind the heading block, plus a rule-colored `text-decoration: underline` (1px, 4px offset) that redraws one thin line under each wrapped line of text — every heading line sits on a line, none cross the glyphs. (A per-line paper mask via `box-decoration-break: clone` was tried first but depended on exact font ascent/descent metrics; the underline approach is metric-independent.) The nudge is measured per element at runtime (real font ascent via canvas, `app/blog/[slug]/page.tsx` baseline effect): padding-top grows while margin-bottom shrinks by the same amount, so each block's footprint stays grid-exact. The effect is idempotent — every run recomputes from the original padding/margin stored on first touch, so image loads, resizes, and FAQ toggles never stack shifts. It is scoped to the article only (`.prose`, tags, footnotes, fin); the like-bar and comments are never touched. Photos (whose heights come from aspect ratios) get their bottom margin snapped so the next block lands back on the grid. Previously un-snapped blocks — h1/h5/h6, tables, FAQs, code blocks, callouts — are now grid multiples too. Single faint margin rule tucked in the gutter (clear of the text), tightened vertical rhythm (`--blog-line: 1.6rem`), drop cap, aged-paper vignette, ❦ divider above footnotes, "Fin." colophon. Both pages end in `BlogFooter` — kicker, Library/Portfolio/X/Instagram/GitHub links, the giant outlined `cerebration` wordmark (animates in letter-by-letter on scroll via pure CSS `animation-timeline: view()`, visible fallback), copyright + back-to-top, over a canvas ember field. The canvas paints its own fade (transparent → tone, no hard edge) and is theme-adaptive: glowing embers on near-black in dark mode, warm sparks on paper in light mode (theme detected via `html.dark` / `.blog-world.dark` with a MutationObserver). Perf: single rAF loop, sprite-based rendering (one pre-rendered glow sprite per hue, one drawImage per ember), delta-time motion, particle count scales with width, DPR capped at 1.5, pauses off-screen via IntersectionObserver, one static frame under `prefers-reduced-motion`. Embers dissolve over the top ~140px so they never pop at the edge. Zero assets. `Cerebration` → `/blog`. `Home` → `/`. Posts use `BlogNav`, not the portfolio `Header`.

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
| **Video** | Upload an MP4/WebM **or** paste a YouTube / Vimeo / direct-MP4 link. Renders in the taped-polaroid frame with a custom player: play/pause, ±10s, scrub bar, mute, fullscreen, and voice control (mic button — say “play”, “pause”, “mute”, “full screen”, “go back”…). YouTube/Vimeo links embed the platform player instead. |

**Video notes (2026-09-30):**
- Schema type is `noteVideo` (`sanity/schemaTypes/blockContentType.ts`); Studio validates that a file **or** URL is present.
- Public player is `components/blog/BlogVideo.tsx` (+ `lib/blog-video.ts` helpers — kept outside the client component so `toBlogVideo()` can run during SSR; calling a `'use client'` function from the server throws).
- Uploaded files resolve via `sanityFileSrc()` → `https://cdn.sanity.io/files/<pid>/<ds>/<hash>.<ext>`; the GROQ body projection in `lib/sanity-queries.ts` expands `noteVideo.file.asset->{url}`.
- The figure reuses the `.blog-photo` taped-polaroid classes, so it snaps to the baseline grid like photos (selector: `figure.blog-photo, figure.blog-image-row`).
- `portableTextComponents` now lives in `components/blog/portableTextComponents.tsx` (extracted from `app/blog/[slug]/page.tsx`) so server routes can import the real renderer map — importing a `'use client'` module from a server component only yields an opaque reference.
- Voice control uses the Web Speech API; the mic button hides itself where unsupported (e.g. Firefox). Not yet tested live with a real microphone.

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

## Engagement (KL-13)

Comments, likes, and views are Supabase rows keyed by the Sanity document id (`post.id`), not `blog_posts`.

- Name only. `localStorage` key `kl_display_name` and cookie `kl_name`. No email, no account.
- `POST/GET /api/blog/comments` — service role, honeypot, length limits, profanity and link rejection, 5 comments / 10 minutes / visitor. Replies use `parent_id` and stop at one level.
- `POST/GET /api/blog/likes` — one row in `blog_post_likes` per visitor cookie. A second like does not increment. `action: "unlike"` removes it.
- `POST /api/blog/views` — `BlogViewBeacon` calls this after mount (not during render). Same visitor + post inside 24 hours does not count. Known bots are skipped.
- If `supabase/migrations/20261008_blog_engagement.sql` has not been applied on the kingslive project, comment GET returns `{ unavailable: true }` and the form is hidden.

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
  - 2026-09-29: he reported comment submits failing. Investigation (see batch notes below)
    confirmed the client flow works and points at this `NOT NULL` constraint as the prime
    suspect; still unconfirmed against the live schema.
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

- **Note-style Sources box, mobile full-bleed article, share-modal fix, background
  wordmark ticker, contrast pass (2026-09-29, uncommitted):** batch from his
  screenshots + notes.
  - **Sources section** (`.blog-footnotes`): now a hand-drawn note card — 2px
    ink border with asymmetric radii
    (`255px 18px 225px 18px / 18px 225px 18px 255px`), subtle paper fill so the
    ruled lines ghost through. The old `.blog-oldbook.blog-footnotes::before`
    wobbly marker stroke stays inside the card, above the title — reads as a
    marker underline, complements the box. Kicker bumped `0.66rem → 0.78rem`
    and switched from muted gray to `--blog-ink` (was hard to read in his
    screenshot). Verified light + dark on a real post page.
  - **Mobile article is full-bleed:** `.blog-read` is `width: 100%` under
    `640px` (measured 390/390 on a 390px viewport); desktop unchanged at
    `width: min(88%, 100rem)`.
  - **Share modal mobile fix** (`app/blog/[slug]/page.tsx`): Framer Motion
    sets inline `transform`, which was overriding the Tailwind centering
    translate classes — the dialog drifted half off-screen on mobile (his
    screenshot: "Share this arti…" cut off at the right edge). Replaced the
    transform-centering with a fixed full-screen flex wrapper (`p-4`,
    `pointer-events-none`) around a `w-full max-w-md` panel
    (`pointer-events-auto`); removed the `mx-4` that overflowed small screens.
    Verified by clicking the real Share button in the mobile bottom bar —
    dialog now opens centered and fully inside the viewport.
  - **Footer wordmark back into the background** (`BlogFooter.tsx` +
    `globals.css`): the outlined `CEREBRATION` news ticker (was front-and-center
    at the foot of the footer, with a hairline running through the letters —
    his screenshot) is now handwritten **Cerebration** (Caveat 600) drifting
    **left → right** over 48s (`translateX(-50%) → 0` seamless loop, pauses on
    footer hover, static under prefers-reduced-motion). It sits at `top: 30%`
    of the footer, `z-index: 2` **behind** the mountain layers (`z-index: 3`),
    at `clamp(5rem, 17vw, 15rem)` and 0.42 opacity — present but quiet. The
    words sit **above** a faint ruled line (the track's own bottom border, so
    the loop stays seamless), like actual handwriting on notebook paper —
    replacing the old line-through-the-letters look. Three repeats per half
    (was six) so the giant type has room to breathe.
  - **Contrast pass** (light + dark): `--blog-muted` `#6b6156 → #52463a`
    (light) / `#9a8f84 → #a79b8d` (dark); `--foot-faint` `#8a7d6c → #6b6055`
    (light) / `#8a7d6c → #9a8f84` (dark); `--foot-ink`/`--foot-muted`
    darkened (light) / lifted (dark) to match. These vars also feed the mobile
    bottom bar and footer small type — spot-checked readable in both themes.
  - **Body text above the rules + bigger type (2026-09-29):** he clarified the
    words should sit *straight above* the notebook lines, not on them. The
    baseline nudge in `app/blog/[slug]/page.tsx` now targets `rule − lift`
    (`lift = max(3px, 12.5% of the grid line)`, 4px on the 32px grid) instead
    of `rule − 0.5px` — same idempotent padding/margin-compensation mechanism,
    still fenced to `.blog-ruled`. Also fixed a real size bug his "increase
    article text size" note exposed: the PortableText `normal` renderer forced
    `text-base` (1rem) directly on every paragraph, which beat the inherited
    `1.5rem` Caveat from `.blog-read .prose` — paragraphs were rendering at
    16px instead of the intended 24px. Removed the class; paragraphs now
    inherit the 1.5rem hand. Verified measured baselines at exactly −4px and
    24px type, light + dark, plain paragraphs and code-chip lines.
  - QA: headless Firefox + Playwright against the dev server (390×844 and
    1440px, light + dark). Note: Firefox headless `--screenshot` fires before
    client fetch resolves, so QA used a temporary API fixture + Playwright
    waits; all temp hooks reverted (final diff is the 3 files only).
  - **Comment-submit failure investigation (2026-09-29, no code changed):** he
    reported comments not submitting. Verified in headless Firefox against a
    real post page: the COMMENT bottom-bar button scrolls to `#comments` and
    fires `open-comments`, the form renders, and validation works — the break
    is at the submit step. Submit path: `Comments.tsx` `handleSubmit` →
    `moderateContent()` → direct `supabase.from('blog_comments').insert()`.
    Findings: (1) `POST /api/moderate` **does not exist** (never did — no git
    history); `moderateWithOpenAI` 404s and fails open, so OpenAI moderation
    silently never runs but doesn't block submission. (2) The insert payload
    is `{post_id, author_name, content, approved, archived}` — **no
    `author_email`**; if that column is `NOT NULL` without a default in
    Supabase, every insert fails at the Postgres level (prime suspect — the
    "before shipping" check above was never confirmed). (3) Secondary
    suspects: RLS (no INSERT policy for `blog_comments` in repo migrations —
    less likely, comments worked before the name-only change) and the
    `comment_count_trigger` AFTER INSERT trigger writing to
    `blog_post_analytics` (would abort the insert if it errors). The UI shows
    the generic "Failed to submit comment. Please try again." banner; the real
    Postgres error is logged via `console.error('Error submitting comment:')`
    — reproducing on the live site with devtools open names the failing
    constraint. Offered: move submission to a server-side `/api/comments`
    route (service key, real error logging); awaiting his Supabase access token
    to confirm against the live schema.
  - **Comment fix (2026-09-29):** he supplied a Supabase personal access token
    and asked for the fix directly. Read-only MCP inspection of the live
    `kinglive cms` project (the token's only project; his second Supabase
    project lives under a different account) confirmed the root cause:
    `blog_comments.author_email` was `NOT NULL` with no default, so every
    name-only insert died on that constraint. RLS was innocent — a public
    INSERT policy exists — and `comment_count_trigger` never fired because the
    insert failed first. **Still needs him:** the token lacks
    `database_migrations_write`, so the one-line
    `ALTER TABLE public.blog_comments ALTER COLUMN author_email DROP NOT NULL`
    must be run in the Supabase SQL editor (or via a write-scoped token) —
    after that, comments submit again with zero code deploy. Shipped alongside:
    `supabase/migrations/20260929_blog_comments_author_email_nullable.sql`
    records the change (note: `supabase/*` is gitignored, so it needs
    `git add -f` like the other tracked migrations); new
    `app/api/moderate/route.ts` implements the missing moderation endpoint —
    calls OpenAI when `OPENAI_API_KEY` is set, otherwise fail-opens with
    `{ flagged: false }` and no `usingFallback` field, preserving the
    long-standing instant auto-approve of clean comments. Verified: `tsc`
    clean, `POST /api/moderate` → 200 `{flagged:false}` on the no-key path.
