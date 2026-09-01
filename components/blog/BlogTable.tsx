type TableRow = { a?: string; b?: string }

export function BlogTable({
  col1,
  col2,
  rows,
  caption,
}: {
  col1?: string
  col2?: string
  rows?: TableRow[]
  caption?: string
}) {
  const body = (rows ?? []).filter((row) => row?.a || row?.b)
  if (body.length === 0 && !col1 && !col2) return null

  return (
    <div className="blog-table-wrap">
      <table className="blog-table">
        {caption ? <caption className="blog-caption">{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">{col1 || ' '}</th>
            <th scope="col">{col2 || ' '}</th>
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i}>
              <td>{row.a}</td>
              <td>{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
