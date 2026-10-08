import {
  RATE_LIMIT,
  RATE_WINDOW_MS,
  SchemaUnavailableError,
  isPostId,
  resolveReplyParent,
  shouldSkipView,
  threadComments,
  validateCommentBody,
  validateLikeBody,
  type EngagementStore,
} from '@/lib/blog/engagement'

export type HandlerResult = {
  status: number
  body: Record<string, unknown>
  /** Set when this request minted a new visitor id. */
  visitorCookie?: string
}

const UNAVAILABLE = 'Comments are offline until this notebook’s database is updated.'

function unavailableComments(): HandlerResult {
  return { status: 200, body: { unavailable: true, comments: [] } }
}

export async function handleCommentsGet(input: {
  postId: string | null
  store: EngagementStore
}): Promise<HandlerResult> {
  const postId = input.postId?.trim() || ''
  if (!isPostId(postId)) return { status: 400, body: { error: 'postId required' } }
  try {
    const rows = await input.store.listComments(postId)
    return { status: 200, body: { comments: threadComments(rows) } }
  } catch (error) {
    if (error instanceof SchemaUnavailableError) return unavailableComments()
    console.error('comments list failed', error)
    return { status: 500, body: { error: 'Could not load comments.' } }
  }
}

export async function handleCommentsPost(input: {
  body: unknown
  visitorId: string
  isNewVisitor: boolean
  store: EngagementStore
  now?: Date
}): Promise<HandlerResult> {
  const parsed = validateCommentBody(input.body)
  if (!parsed.ok) return { status: 400, body: { error: parsed.error } }
  const cookie = input.isNewVisitor ? input.visitorId : undefined
  if (parsed.honeypot) {
    return { status: 200, body: { ok: true }, visitorCookie: cookie }
  }

  try {
    const now = input.now ?? new Date()
    const since = new Date(now.getTime() - RATE_WINDOW_MS).toISOString()
    const recent = await input.store.countCommentsSince(input.visitorId, since)
    if (recent >= RATE_LIMIT) {
      return {
        status: 429,
        body: { error: 'Slow down a little — try again in a few minutes.' },
        visitorCookie: cookie,
      }
    }

    let parentId: string | null = null
    if (parsed.parentId) {
      const parent = await input.store.findComment(parsed.parentId)
      const resolved = resolveReplyParent(parent, parsed.postId)
      if (!resolved.ok) return { status: 400, body: { error: resolved.error }, visitorCookie: cookie }
      parentId = resolved.parentId
    }

    const comment = await input.store.insertComment({
      postId: parsed.postId,
      parentId,
      authorName: parsed.authorName,
      content: parsed.content,
      visitorId: input.visitorId,
    })
    return { status: 201, body: { ok: true, comment }, visitorCookie: cookie }
  } catch (error) {
    if (error instanceof SchemaUnavailableError) {
      return { status: 503, body: { unavailable: true, error: UNAVAILABLE }, visitorCookie: cookie }
    }
    console.error('comment insert failed', error)
    return { status: 500, body: { error: 'Could not post that comment.' }, visitorCookie: cookie }
  }
}

export async function handleLikesGet(input: {
  postId: string | null
  visitorId: string
  store: EngagementStore
}): Promise<HandlerResult> {
  const postId = input.postId?.trim() || ''
  if (!isPostId(postId)) return { status: 400, body: { error: 'postId required' } }
  try {
    const state = await input.store.likeState(postId, input.visitorId)
    return { status: 200, body: state }
  } catch (error) {
    if (error instanceof SchemaUnavailableError) {
      return { status: 200, body: { likes: 0, liked: false, unavailable: true } }
    }
    console.error('likes read failed', error)
    return { status: 200, body: { likes: 0, liked: false } }
  }
}

export async function handleLikesPost(input: {
  body: unknown
  visitorId: string
  isNewVisitor: boolean
  store: EngagementStore
}): Promise<HandlerResult> {
  const parsed = validateLikeBody(input.body)
  if (!parsed.ok) return { status: 400, body: { error: parsed.error } }
  const cookie = input.isNewVisitor ? input.visitorId : undefined
  try {
    const state = parsed.action === 'unlike'
      ? await input.store.unlike(parsed.postId, input.visitorId)
      : await input.store.like(parsed.postId, input.visitorId)
    return { status: 200, body: state, visitorCookie: cookie }
  } catch (error) {
    if (error instanceof SchemaUnavailableError) {
      return {
        status: 200,
        body: { likes: 0, liked: false, unavailable: true },
        visitorCookie: cookie,
      }
    }
    console.error('like write failed', error)
    return { status: 500, body: { error: 'Could not update the like.' }, visitorCookie: cookie }
  }
}

export async function handleViewPost(input: {
  body: unknown
  visitorId: string
  isNewVisitor: boolean
  userAgent: string | null
  purpose: string | null
  store: EngagementStore
  now?: Date
}): Promise<HandlerResult> {
  const record = input.body && typeof input.body === 'object' ? (input.body as Record<string, unknown>) : null
  const postId = typeof record?.postId === 'string' ? record.postId.trim() : ''
  if (!isPostId(postId)) return { status: 400, body: { error: 'postId required' } }
  const cookie = input.isNewVisitor ? input.visitorId : undefined

  if (shouldSkipView(input.userAgent, input.purpose)) {
    return { status: 200, body: { counted: false, skipped: 'bot' }, visitorCookie: cookie }
  }

  try {
    const result = await input.store.recordView(postId, input.visitorId, input.now ?? new Date())
    return { status: 200, body: result, visitorCookie: cookie }
  } catch (error) {
    if (error instanceof SchemaUnavailableError) {
      return { status: 200, body: { counted: false, views: 0, unavailable: true }, visitorCookie: cookie }
    }
    console.error('view record failed', error)
    return { status: 200, body: { counted: false, views: 0 }, visitorCookie: cookie }
  }
}
