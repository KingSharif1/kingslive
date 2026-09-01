type FaqItem = { question?: string; answer?: string }

export function BlogFaq({ heading, items }: { heading?: string; items?: FaqItem[] }) {
  const list = (items ?? []).filter((item) => item?.question)
  if (list.length === 0) return null

  return (
    <section className="blog-faq">
      {heading ? <h2 className="blog-faq__title">{heading}</h2> : null}
      {list.map((item, i) => (
        <details key={`${item.question}-${i}`} className="blog-faq__item">
          <summary className="blog-faq__q">{item.question}</summary>
          <p className="blog-faq__a">{item.answer}</p>
        </details>
      ))}
    </section>
  )
}
