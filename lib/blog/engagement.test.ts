import { describe, expect, it } from 'vitest'
import {
  hasLinkSpam,
  hasProfanity,
  resolveReplyParent,
  shouldCountView,
  shouldSkipView,
  threadComments,
  validateCommentBody,
  VIEW_WINDOW_MS,
  type CommentRow,
} from '@/lib/blog/engagement'

const POST = 'roomba-post'

describe('comment validation', () => {
  it('accepts a name and a comment and ignores email', () => {
    const result = validateCommentBody({
      postId: POST,
      authorName: 'Ada',
      author_email: 'ada@example.com',
      content: 'The lidar mount is clever.',
    })
    expect(result).toMatchObject({
      ok: true,
      honeypot: false,
      authorName: 'Ada',
      content: 'The lidar mount is clever.',
      parentId: null,
    })
  })

  it('rejects a missing name, a missing comment, and an oversized comment', () => {
    expect(validateCommentBody({ postId: POST, authorName: ' ', content: 'hi' }).ok).toBe(false)
    expect(validateCommentBody({ postId: POST, authorName: 'Ada', content: '  ' }).ok).toBe(false)
    expect(validateCommentBody({ postId: POST, authorName: 'Ada', content: 'x'.repeat(2001) }).ok).toBe(false)
    expect(validateCommentBody({ postId: '', authorName: 'Ada', content: 'hi' }).ok).toBe(false)
  })

  it('treats a filled honeypot as a silent accept', () => {
    expect(validateCommentBody({
      postId: POST,
      authorName: 'Ada',
      content: 'hi',
      website: 'https://spam.example',
    })).toEqual({ ok: true, honeypot: true })
  })

  it('rejects profanity and link spam', () => {
    expect(hasProfanity('this is damn rude')).toBe(true)
    expect(validateCommentBody({ postId: POST, authorName: 'Ada', content: 'this is damn rude' }).ok).toBe(false)
    expect(hasLinkSpam('see https://spam.example/deal')).toBe(true)
    expect(validateCommentBody({
      postId: POST,
      authorName: 'Ada',
      content: 'see https://spam.example/deal',
    }).ok).toBe(false)
  })
})

describe('threading', () => {
  const root = { id: '00000000-0000-4000-8000-000000000001', post_id: POST, parent_id: null }
  const reply = { id: '00000000-0000-4000-8000-000000000002', post_id: POST, parent_id: root.id }

  it('allows a reply to a root comment on the same note', () => {
    expect(resolveReplyParent(root, POST)).toEqual({ ok: true, parentId: root.id })
  })

  it('rejects a reply to a reply and a parent from another note', () => {
    expect(resolveReplyParent(reply, POST).ok).toBe(false)
    expect(resolveReplyParent({ ...root, post_id: 'other-note' }, POST).ok).toBe(false)
    expect(resolveReplyParent(null, POST).ok).toBe(false)
  })

  it('nests one level and keeps orphan replies visible', () => {
    const rows: CommentRow[] = [
      { ...root, author_name: 'Ada', content: 'root', created_at: '2026-01-01T00:00:00.000Z' },
      { ...reply, author_name: 'Bea', content: 'reply', created_at: '2026-01-01T00:01:00.000Z' },
      {
        id: '00000000-0000-4000-8000-000000000003',
        post_id: POST,
        parent_id: 'missing',
        author_name: 'Cy',
        content: 'orphan',
        created_at: '2026-01-01T00:02:00.000Z',
      },
    ]
    const tree = threadComments(rows)
    expect(tree).toHaveLength(2)
    expect(tree[0].replies.map((item) => item.author_name)).toEqual(['Bea'])
    expect(tree[1].author_name).toBe('Cy')
  })
})

describe('view dedupe', () => {
  const now = new Date('2026-10-08T12:00:00.000Z')

  it('counts the first view, skips the 24h window, and counts again after it', () => {
    expect(shouldCountView(null, now)).toBe(true)
    expect(shouldCountView(new Date(now.getTime() - 60_000), now)).toBe(false)
    expect(shouldCountView(new Date(now.getTime() - VIEW_WINDOW_MS), now)).toBe(false)
    expect(shouldCountView(new Date(now.getTime() - VIEW_WINDOW_MS - 1), now)).toBe(true)
  })

  it('skips bots and prefetches', () => {
    expect(shouldSkipView('Mozilla/5.0', null)).toBe(false)
    expect(shouldSkipView('Mozilla/5.0 (compatible; Googlebot/2.1)', null)).toBe(true)
    expect(shouldSkipView('Mozilla/5.0', 'prefetch')).toBe(true)
  })
})
