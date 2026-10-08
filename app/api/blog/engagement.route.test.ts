import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as listComments, POST as postComment } from '@/app/api/blog/comments/route'
import { GET as getLikes, POST as postLike } from '@/app/api/blog/likes/route'
import { POST as postView } from '@/app/api/blog/views/route'
import { VIEW_WINDOW_MS, VISITOR_COOKIE } from '@/lib/blog/engagement'
import { __setEngagementStoreForTests } from '@/lib/blog/engagement-store'
import { handleViewPost } from '@/lib/blog/handlers'
import { createMemoryStore } from '@/lib/blog/memory-store'

const POST_ID = 'roomba694'
const store = createMemoryStore()

beforeEach(() => {
  store.reset()
  __setEngagementStoreForTests(store)
})

afterEach(() => {
  __setEngagementStoreForTests(null)
})

function cookieOf(res: Response): string | undefined {
  const raw = res.headers.get('set-cookie') || ''
  const match = raw.match(new RegExp(`${VISITOR_COOKIE}=([^;]+)`))
  return match?.[1]
}

function jsonRequest(url: string, body: unknown, cookie?: string, headers?: Record<string, string>) {
  const initHeaders = new Headers({ 'content-type': 'application/json', ...headers })
  if (cookie) initHeaders.set('cookie', `${VISITOR_COOKIE}=${cookie}`)
  return new NextRequest(url, { method: 'POST', headers: initHeaders, body: JSON.stringify(body) })
}

describe('POST /api/blog/comments', () => {
  it('validates input, swallows the honeypot, and rate-limits a visitor', async () => {
    const missing = await postComment(jsonRequest('http://localhost/api/blog/comments', {
      postId: POST_ID,
      authorName: '',
      content: 'hello',
    }))
    expect(missing.status).toBe(400)

    const honeypot = await postComment(jsonRequest('http://localhost/api/blog/comments', {
      postId: POST_ID,
      authorName: 'Ada',
      content: 'hello there',
      website: 'https://spam.example',
    }))
    expect(honeypot.status).toBe(200)
    expect(store.comments).toHaveLength(0)

    const visitor = '11111111-1111-4111-8111-111111111111'
    for (let i = 0; i < 5; i += 1) {
      const res = await postComment(jsonRequest('http://localhost/api/blog/comments', {
        postId: POST_ID,
        authorName: 'Ada',
        content: `note ${i} is long enough`,
      }, visitor))
      expect(res.status).toBe(201)
    }
    const blocked = await postComment(jsonRequest('http://localhost/api/blog/comments', {
      postId: POST_ID,
      authorName: 'Ada',
      content: 'one more note',
    }, visitor))
    expect(blocked.status).toBe(429)
    expect(store.comments).toHaveLength(5)
  })

  it('threads a reply and refuses a third level', async () => {
    const visitor = '22222222-2222-4222-8222-222222222222'
    const rootRes = await postComment(jsonRequest('http://localhost/api/blog/comments', {
      postId: POST_ID,
      authorName: 'Ada',
      content: 'First note on the build.',
    }, visitor))
    const root = (await rootRes.json()).comment as { id: string }
    expect(rootRes.status).toBe(201)

    const replyRes = await postComment(jsonRequest('http://localhost/api/blog/comments', {
      postId: POST_ID,
      authorName: 'Bea',
      content: 'Same here.',
      parentId: root.id,
    }, visitor))
    const reply = (await replyRes.json()).comment as { id: string; parent_id: string }
    expect(replyRes.status).toBe(201)
    expect(reply.parent_id).toBe(root.id)

    const tooDeep = await postComment(jsonRequest('http://localhost/api/blog/comments', {
      postId: POST_ID,
      authorName: 'Cy',
      content: 'And another.',
      parentId: reply.id,
    }, visitor))
    expect(tooDeep.status).toBe(400)

    const listed = await listComments(new NextRequest(`http://localhost/api/blog/comments?postId=${POST_ID}`))
    const body = await listed.json()
    expect(listed.status).toBe(200)
    expect(body.comments).toHaveLength(1)
    expect(body.comments[0].replies).toHaveLength(1)
    expect(body.comments[0].replies[0].author_name).toBe('Bea')
    expect(JSON.stringify(body)).not.toContain('author_email')
  })

  it('hides the box payload when the schema is unavailable', async () => {
    __setEngagementStoreForTests(createMemoryStore({ unavailable: true }))
    const res = await listComments(new NextRequest(`http://localhost/api/blog/comments?postId=${POST_ID}`))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ unavailable: true, comments: [] })
  })
})

describe('POST /api/blog/likes', () => {
  it('counts one like per visitor, ignores a repeat, and allows unlike', async () => {
    const visitor = '33333333-3333-4333-8333-333333333333'
    const first = await postLike(jsonRequest('http://localhost/api/blog/likes', { postId: POST_ID, action: 'like' }, visitor))
    expect(await first.json()).toMatchObject({ likes: 1, liked: true })

    const again = await postLike(jsonRequest('http://localhost/api/blog/likes', { postId: POST_ID, action: 'like' }, visitor))
    expect(await again.json()).toMatchObject({ likes: 1, liked: true })

    const read = await getLikes(new NextRequest(`http://localhost/api/blog/likes?postId=${POST_ID}`, {
      headers: { cookie: `${VISITOR_COOKIE}=${visitor}` },
    }))
    expect(await read.json()).toMatchObject({ likes: 1, liked: true })

    const other = '44444444-4444-4444-8444-444444444444'
    const second = await postLike(jsonRequest('http://localhost/api/blog/likes', { postId: POST_ID, action: 'like' }, other))
    expect(await second.json()).toMatchObject({ likes: 2, liked: true })

    const removed = await postLike(jsonRequest('http://localhost/api/blog/likes', { postId: POST_ID, action: 'unlike' }, visitor))
    expect(await removed.json()).toMatchObject({ likes: 1, liked: false })
  })
})

describe('POST /api/blog/views', () => {
  it('counts one view per visitor inside the window and skips bots', async () => {
    const human = jsonRequest('http://localhost/api/blog/views', { postId: POST_ID }, undefined, {
      'user-agent': 'Mozilla/5.0',
    })
    const first = await postView(human)
    const visitor = cookieOf(first)
    expect(visitor).toBeTruthy()
    expect(await first.json()).toMatchObject({ counted: true, views: 1 })

    const second = await postView(jsonRequest('http://localhost/api/blog/views', { postId: POST_ID }, visitor, {
      'user-agent': 'Mozilla/5.0',
    }))
    expect(await second.json()).toMatchObject({ counted: false, views: 1 })

    const bot = await postView(jsonRequest('http://localhost/api/blog/views', { postId: POST_ID }, undefined, {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    }))
    expect(await bot.json()).toMatchObject({ counted: false, skipped: 'bot' })
    expect((await postView(jsonRequest('http://localhost/api/blog/views', { postId: POST_ID }, visitor, {
      'user-agent': 'Mozilla/5.0',
    }))).status).toBe(200)
  })

  it('counts again once the 24h window has passed', async () => {
    const visitor = '55555555-5555-4555-8555-555555555555'
    const now = new Date('2026-10-08T12:00:00.000Z')
    const first = await handleViewPost({
      body: { postId: POST_ID },
      visitorId: visitor,
      isNewVisitor: false,
      userAgent: 'Mozilla/5.0',
      purpose: null,
      store,
      now,
    })
    expect(first.body).toMatchObject({ counted: true, views: 1 })

    const inside = await handleViewPost({
      body: { postId: POST_ID },
      visitorId: visitor,
      isNewVisitor: false,
      userAgent: 'Mozilla/5.0',
      purpose: null,
      store,
      now: new Date(now.getTime() + VIEW_WINDOW_MS),
    })
    expect(inside.body).toMatchObject({ counted: false, views: 1 })

    const after = await handleViewPost({
      body: { postId: POST_ID },
      visitorId: visitor,
      isNewVisitor: false,
      userAgent: 'Mozilla/5.0',
      purpose: null,
      store,
      now: new Date(now.getTime() + VIEW_WINDOW_MS + 1),
    })
    expect(after.body).toMatchObject({ counted: true, views: 2 })
  })
})
