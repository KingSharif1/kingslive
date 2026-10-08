'use client'

import { useEffect, useId, useState } from 'react'
import { readDisplayName, rememberDisplayName } from '@/lib/blog/display-name'

type Comment = {
  id: string
  post_id: string
  parent_id: string | null
  author_name: string
  content: string
  created_at: string
  replies?: Comment[]
}

const OFFLINE = 'Comments are offline until this notebook’s database is updated. You can still read the note.'

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Comments({ postId }: { postId: string; autoApproveHours?: number }) {
  const nameId = useId()
  const bodyId = useId()
  const websiteId = useId()
  const [comments, setComments] = useState<Comment[]>([])
  const [unavailable, setUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [website, setWebsite] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setName(readDisplayName())
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const res = await fetch(`/api/blog/comments?postId=${encodeURIComponent(postId)}`, { cache: 'no-store' })
        const data = (await res.json()) as { comments?: Comment[]; unavailable?: boolean; error?: string }
        if (cancelled) return
        if (data.unavailable) {
          setUnavailable(true)
          setComments([])
          return
        }
        if (!res.ok) {
          setLoadError(data.error || 'Could not load comments.')
          setComments([])
          return
        }
        setComments(Array.isArray(data.comments) ? data.comments : [])
      } catch {
        if (!cancelled) setLoadError('Could not load comments.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    const open = () => {
      setShowForm(true)
      window.setTimeout(() => {
        document.getElementById(bodyId)?.focus()
      }, 0)
    }
    window.addEventListener('open-comments', open)
    return () => {
      cancelled = true
      window.removeEventListener('open-comments', open)
    }
  }, [postId, bodyId])

  const onName = (value: string) => {
    setName(value)
    rememberDisplayName(value)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')
    rememberDisplayName(name)
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          authorName: name,
          content,
          parentId: replyTo?.id ?? null,
          website,
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        unavailable?: boolean
        error?: string
        comment?: Comment
      }
      if (data.unavailable) {
        setUnavailable(true)
        setShowForm(false)
        return
      }
      if (!res.ok) {
        setError(data.error || 'Could not post that comment.')
        return
      }
      if (data.comment) {
        setComments((prev) => insertComment(prev, data.comment as Comment))
      }
      setContent('')
      setReplyTo(null)
      setShowForm(false)
      setNotice('Posted.')
    } catch {
      setError('Could not post that comment.')
    } finally {
      setSubmitting(false)
    }
  }

  const count = comments.reduce((sum, comment) => sum + 1 + (comment.replies?.length || 0), 0)

  return (
    <section id="comments" className="blog-comments" aria-labelledby="comments-heading">
      <div className="blog-comments__head">
        <h2 id="comments-heading">
          Comments{count > 0 ? ` (${count})` : ''}
        </h2>
        {!unavailable && !showForm && (
          <button type="button" className="blog-comments__textbtn" onClick={() => setShowForm(true)}>
            Leave a note
          </button>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">{notice}</p>

      {unavailable ? (
        <p className="blog-comments__quiet">{OFFLINE}</p>
      ) : (
        <>
          {showForm && (
            <form className="blog-comments__form" onSubmit={submit}>
              <div className="blog-comments__field">
                <label htmlFor={nameId}>Name</label>
                <input
                  id={nameId}
                  name="authorName"
                  type="text"
                  autoComplete="nickname"
                  maxLength={40}
                  required
                  value={name}
                  onChange={(event) => onName(event.target.value)}
                />
              </div>

              <div className="blog-comments__hp" aria-hidden="true">
                <label htmlFor={websiteId}>Website</label>
                <input
                  id={websiteId}
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              {replyTo && (
                <p className="blog-comments__replying" id="comment-replying">
                  Replying to {replyTo.name}
                  <button type="button" onClick={() => setReplyTo(null)}>
                    Cancel reply
                  </button>
                </p>
              )}

              <div className="blog-comments__field">
                <label htmlFor={bodyId}>Comment</label>
                <textarea
                  id={bodyId}
                  name="content"
                  required
                  rows={4}
                  maxLength={2000}
                  value={content}
                  aria-describedby={replyTo ? 'comment-replying' : undefined}
                  onChange={(event) => setContent(event.target.value)}
                />
                <span className="blog-comments__count">{content.length}/2000</span>
              </div>

              {error && (
                <p className="blog-comments__error" role="alert">{error}</p>
              )}

              <div className="blog-comments__actions">
                <button
                  type="button"
                  className="blog-comments__textbtn"
                  onClick={() => {
                    setShowForm(false)
                    setError('')
                    setReplyTo(null)
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="blog-comments__submit" disabled={submitting}>
                  {submitting ? 'Posting…' : replyTo ? 'Post reply' : 'Post'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="blog-comments__quiet">Loading comments…</p>
          ) : loadError ? (
            <p className="blog-comments__error" role="alert">{loadError}</p>
          ) : comments.length === 0 ? (
            <p className="blog-comments__quiet">No notes in the margin yet.</p>
          ) : (
            <ul className="blog-comments__list">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <CommentItem
                    comment={comment}
                    onReply={() => {
                      setReplyTo({ id: comment.id, name: comment.author_name })
                      setShowForm(true)
                      window.setTimeout(() => document.getElementById(bodyId)?.focus(), 0)
                    }}
                  />
                  {comment.replies && comment.replies.length > 0 && (
                    <ul className="blog-comments__replies">
                      {comment.replies.map((reply) => (
                        <li key={reply.id}>
                          <CommentItem comment={reply} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

function insertComment(list: Comment[], comment: Comment): Comment[] {
  if (!comment.parent_id) return [...list, { ...comment, replies: comment.replies ?? [] }]
  return list.map((item) => {
    if (item.id !== comment.parent_id) return item
    return { ...item, replies: [...(item.replies ?? []), comment] }
  })
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply?: () => void }) {
  return (
    <article className="blog-comments__item">
      <header>
        <span className="blog-comments__author">{comment.author_name}</span>
        <time dateTime={comment.created_at}>{formatDate(comment.created_at)}</time>
      </header>
      <p>{comment.content}</p>
      {onReply && (
        <button type="button" className="blog-comments__textbtn" onClick={onReply} aria-label={`Reply to ${comment.author_name}`}>
          Reply
        </button>
      )}
    </article>
  )
}
