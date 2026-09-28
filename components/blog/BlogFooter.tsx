'use client'

import Link from 'next/link'

// Blog footer — a quiet mountain scene. Two SVG ridge layers drift slowly
// (seamless -50% loop, pure CSS), a moon/sun glows, stars twinkle in dark
// mode, and soft clouds + wind streaks drift through in light mode.
// The CEREBRATION wordmark is a news ticker scrolling left → right.
// No canvas, no pointer interactions — just ambient motion.
// - Fades out of the page (transparent -> sky tone), no hard edge.
// - Light/dark adaptive via --foot-* vars.
// - Static under prefers-reduced-motion. Zero assets.
const WORD = 'CEREBRATION'

// Deterministic star field (seeded so server and client agree).
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const STARS = (() => {
  const rand = mulberry32(20260928)
  return Array.from({ length: 64 }, (_, i) => ({
    id: i,
    left: rand() * 100,
    top: rand() * 52,
    size: 1 + rand() * 2.2,
    delay: rand() * 6,
    dur: 2.6 + rand() * 4.2,
  }))
})()

// One 1200-wide ridge tile; rendered twice side-by-side (2400 viewBox) so the
// -50% drift loop is seamless.
const BACK_TILE =
  'M0,260 L0,168 L60,150 L110,166 L170,120 L225,142 L290,70 L350,128 L405,102 ' +
  'L470,150 L540,118 L600,170 L665,138 L730,158 L795,96 L860,142 L920,116 ' +
  'L985,162 L1050,132 L1115,156 L1200,140 L1200,260 Z'
const FRONT_TILE =
  'M0,200 L0,152 L90,128 L170,150 L260,112 L350,146 L440,120 L530,152 L620,126 ' +
  'L710,148 L800,118 L890,144 L980,124 L1070,146 L1200,132 L1200,200 Z'

export default function BlogFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="blog-footer blog-footer--mountains" aria-label="Footer">
      <div className="blog-footer__stars" aria-hidden="true">
        {STARS.map((s) => (
          <span
            key={s.id}
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}
      </div>
      <div className="blog-footer__moon" aria-hidden="true" />
      {/* Light-mode wind: soft clouds + streaks drifting left → right.
          Hidden in dark mode via CSS; the night sky keeps its stars. */}
      <div className="blog-footer__wind" aria-hidden="true">
        <span className="blog-footer__cloud blog-footer__cloud--1" />
        <span className="blog-footer__cloud blog-footer__cloud--2" />
        <span className="blog-footer__cloud blog-footer__cloud--3" />
        <span className="blog-footer__cloud blog-footer__cloud--4" />
        <span className="blog-footer__streak blog-footer__streak--1" />
        <span className="blog-footer__streak blog-footer__streak--2" />
        <span className="blog-footer__streak blog-footer__streak--3" />
      </div>
      <div className="blog-footer__mountains" aria-hidden="true">
        <svg
          className="blog-footer__ridge blog-footer__ridge--back"
          viewBox="0 0 2400 260"
          preserveAspectRatio="none"
        >
          <defs>
            <path id="foot-ridge-back" d={BACK_TILE} />
          </defs>
          <use href="#foot-ridge-back" />
          <use href="#foot-ridge-back" x="1200" />
        </svg>
        <svg
          className="blog-footer__ridge blog-footer__ridge--front"
          viewBox="0 0 2400 200"
          preserveAspectRatio="none"
        >
          <defs>
            <path id="foot-ridge-front" d={FRONT_TILE} />
          </defs>
          <use href="#foot-ridge-front" />
          <use href="#foot-ridge-front" x="1200" />
        </svg>
      </div>

      <div className="blog-footer__inner">
        <p className="blog-footer__kicker">Cerebration — a library of building in public</p>
        <nav className="blog-footer__links" aria-label="Footer">
          <Link href="/blog">Library</Link>
          <Link href="/">Portfolio</Link>
          <a href="https://x.com/princeThe_great" target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a href="https://instagram.com/k1ngsharif" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="https://github.com/KingSharif1" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </div>

      {/* News ticker wordmark, scrolling left → right (aria-hidden: decorative). */}
      <div className="blog-footer__ticker" aria-hidden="true">
        <div className="blog-footer__ticker-track">
          {[0, 1].map((half) => (
            <span className="blog-footer__ticker-half" key={half}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span className="blog-footer__ticker-item" key={i}>
                  {WORD}
                  <span className="blog-footer__ticker-sep">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="blog-footer__base">
        <span>© {year} King Sharif</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  )
}
