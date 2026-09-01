import Image from 'next/image'
import { sanityImageSrc } from '@/lib/sanity-image'

export type BlogPhoto = { src: string; alt: string; caption?: string }

export function toBlogPhotos(images: unknown): BlogPhoto[] {
  const list = Array.isArray(images) ? images : images ? [images] : []
  return list
    .map((img) => {
      const item = img as { alt?: string; caption?: string; asset?: { url?: string; _ref?: string } }
      const src = sanityImageSrc(item)
      if (!src) return null
      return { src, alt: item.alt || '', caption: item.caption }
    })
    .filter((p): p is BlogPhoto => Boolean(p))
}

export function BlogPhotos({ images, caption }: { images: BlogPhoto[]; caption?: string }) {
  if (images.length === 0) return null

  if (images.length === 1) {
    const photo = images[0]
    const cap = photo.caption || caption
    return (
      <figure className="blog-photo">
        <Image
          src={photo.src}
          alt={photo.alt || 'Photo'}
          width={960}
          height={720}
          className="blog-photo__img"
          quality={85}
        />
        {cap ? <figcaption className="blog-caption">{cap}</figcaption> : null}
      </figure>
    )
  }

  const count = Math.min(images.length, 3)
  return (
    <figure className="blog-image-row" data-count={count}>
      <div className="blog-image-row__grid">
        {images.slice(0, 3).map((photo, i) => (
          <div key={`${photo.src}-${i}`} className="blog-image-row__cell">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={640}
              height={800}
              className="blog-image-row__img"
              quality={85}
              sizes={count === 3 ? '(min-width: 672px) 14rem, 33vw' : '(min-width: 672px) 20rem, 50vw'}
            />
            {photo.caption ? <p className="blog-caption">{photo.caption}</p> : null}
          </div>
        ))}
      </div>
      {caption ? <figcaption className="blog-caption blog-caption--set">{caption}</figcaption> : null}
    </figure>
  )
}
