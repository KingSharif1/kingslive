import { PortableText, PortableTextComponents } from "@portabletext/react"
import { BlogPhotos, toBlogPhotos } from "@/components/blog/BlogPhotos"
import { BlogVideo } from "@/components/blog/BlogVideo"
import { toBlogVideo } from "@/lib/blog-video"
import { BlogTable } from "@/components/blog/BlogTable"
import { BlogFaq } from "@/components/blog/BlogFaq"

// PortableText components for proper rendering
export const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h1 className="text-4xl font-bold font-fraunces mt-9 mb-4 text-[var(--foreground)]">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-bold font-fraunces mt-8 mb-4 text-[var(--foreground)]">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-semibold font-fraunces mt-7 mb-3 text-[var(--foreground)]">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-semibold font-fraunces mt-6 mb-2 text-[var(--foreground)]">{children}</h4>,
    h5: ({ children }) => <h5 className="text-lg font-semibold font-fraunces mt-5 mb-2 text-[var(--foreground)]">{children}</h5>,
    h6: ({ children }) => <h6 className="text-base font-semibold font-fraunces mt-4 mb-2 text-[var(--foreground)]">{children}</h6>,
    normal: ({ children }) => <p className="leading-relaxed mb-5 text-[var(--foreground)]">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[var(--blog-bloom)] pl-6 py-2 my-5 italic text-xl text-[var(--blog-ink)]">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc list-outside ml-6 mb-5 space-y-2">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-5 space-y-2">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-[var(--foreground)] leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="text-[var(--foreground)] leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-[var(--secondary)] px-2 py-1 rounded text-sm font-mono text-[var(--foreground)]">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="blog-link text-[var(--blog-bloom)] underline decoration-from-font underline-offset-4"
        >
          {children}
        </a>
      )
    },
  },
  types: {
    image: ({ value }) => <BlogPhotos images={toBlogPhotos(value)} />,
    photos: ({ value }) => (
      <BlogPhotos images={toBlogPhotos(value?.images)} caption={value?.caption} />
    ),
    noteVideo: ({ value }) => {
      const video = toBlogVideo(value)
      if (!video) return null
      return <BlogVideo src={video.src} caption={video.caption} />
    },
    imageRow: ({ value }) => (
      <BlogPhotos images={toBlogPhotos(value?.images)} caption={value?.caption} />
    ),
    table: ({ value }) => (
      <BlogTable col1={value?.col1} col2={value?.col2} rows={value?.rows} caption={value?.caption} />
    ),
    noteTable: ({ value }) => (
      <BlogTable col1={value?.col1} col2={value?.col2} rows={value?.rows} caption={value?.caption} />
    ),
    faq: ({ value }) => <BlogFaq heading={value?.heading} items={value?.items} />,
    code: ({ value }) => (
      <div className="blog-codeblock rounded-lg overflow-hidden border border-[var(--border)]">
        {/* Header with language/filename */}
        <div className="blog-codeblock__bar bg-[var(--secondary)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <span className="text-xs font-mono text-[var(--muted-foreground)] ml-2">
              {value?.filename || value?.language || 'code'}
            </span>
          </div>
          {value?.language && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent)] text-[var(--muted-foreground)]">
              {value.language}
            </span>
          )}
        </div>
        {/* Code content */}
        <pre className="bg-[var(--card)] p-4 overflow-x-auto">
          <code className="text-sm font-mono text-[var(--foreground)] leading-relaxed">
            {value?.code}
          </code>
        </pre>
      </div>
    ),
    callout: ({ value }) => {
      const calloutComponents: PortableTextComponents = {
        block: {
          normal: ({ children }) => <p className="leading-relaxed mb-2 last:mb-0">{children}</p>,
        },
        marks: {
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children }) => <code className="font-mono text-[0.9em]">{children}</code>,
          link: ({ value: linkValue, children }) => (
            <a href={linkValue?.href} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        },
        types: {
          image: ({ value: imgValue }) => <BlogPhotos images={toBlogPhotos(imgValue)} />,
        },
      }

      const kicker = value?.title || value?.type || 'Note'

      return (
        <aside className="blog-aside">
          {kicker ? <p className="blog-aside__kicker">{kicker}</p> : null}
          {Array.isArray(value?.content) ? (
            <PortableText value={value.content} components={calloutComponents} />
          ) : (
            <p className="leading-relaxed">{value?.content}</p>
          )}
        </aside>
      )
    },
  },
}
