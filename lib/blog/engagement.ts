import { moderateContentBasic } from '@/lib/content-moderation'

/** HttpOnly visitor id. Not an account. */
export const VISITOR_COOKIE = 'kl_vid'

/** Display name remembered in the browser. Not an account. */
export const NAME_STORAGE_KEY = 'kl_display_name'
export const NAME_COOKIE = 'kl_name'

export const VIEW_WINDOW_MS = 24 * 60 * 60 * 1000
export const RATE_WINDOW_MS = 10 * 60 * 1000
export const RATE_LIMIT = 5
export const NAME_MAX = 40
export const CONTENT_MAX = 2000

const POST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/
const VISITOR_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LINK_RE = /\b(?:https?:\/\/|www\.)[^\s]+/i
const BOT_RE =
  /bot|crawler|spider|slurp|facebookexternalhit|embedly|quora link preview|whatsapp|telegrambot|slackbot|discordbot|wget|curl\/|headlesschrome|lighthouse|pingdom|uptimerobot|semrush|ahrefs|petalbot|bytespider|gptbot|claudebot|amazonbot|applebot/i

export class SchemaUnavailableError extends Error {
  constructor(message = 'Blog engagement schema is not available') {
    super(message)
    this.name = 'SchemaUnavailableError'
  }
}

export type CommentRow = {
  id: string
  post_id: string
  parent_id: string | null
  author_name: string
  content: string
  created_at: string
}

export type ThreadedComment = CommentRow & { replies: CommentRow[] }

export type LikeState = { likes: number; liked: boolean }

export type ViewResult = { views: number; counted: boolean }

export interface EngagementStore {
  listComments(postId: string): Promise<CommentRow[]>
  findComment(id: string): Promise<Pick<CommentRow, 'id' | 'post_id' | 'parent_id'> | null>
  countCommentsSince(visitorId: string, sinceIso: string): Promise<number>
  insertComment(input: {
    postId: string
    parentId: string | null
    authorName: string
    content: string
    visitorId: string
  }): Promise<CommentRow>
  likeState(postId: string, visitorId: string): Promise<LikeState>
  like(postId: string, visitorId: string): Promise<LikeState>
  unlike(postId: string, visitorId: string): Promise<LikeState>
  recordView(postId: string, visitorId: string, now: Date): Promise<ViewResult>
}

export function isSchemaMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  const code = error.code || ''
  if (
    code === '42P01' ||
    code === '42703' ||
    code === '42883' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === 'PGRST202'
  ) {
    return true
  }
  const msg = (error.message || '').toLowerCase()
  return (
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the function') ||
    msg.includes('could not find the table')
  )
}

export function isPostId(value: string): boolean {
  return POST_ID_RE.test(value)
}

export function visitorFromCookie(value: string | undefined | null): { id: string; isNew: boolean } {
  if (value && VISITOR_ID_RE.test(value)) return { id: value, isNew: false }
  return { id: crypto.randomUUID(), isNew: true }
}

export function visitorCookieOptions(): {
  httpOnly: boolean
  sameSite: 'lax'
  secure: boolean
  path: string
  maxAge: number
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 400,
  }
}

/**
 * Count a view only when this visitor has never opened the note, or the last
 * hit is strictly older than 24h. Matches record_blog_view's conflict WHERE.
 */
export function shouldCountView(lastViewedAt: Date | null, now: Date, windowMs = VIEW_WINDOW_MS): boolean {
  if (!lastViewedAt || Number.isNaN(lastViewedAt.getTime())) return true
  return now.getTime() - lastViewedAt.getTime() > windowMs
}

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  return BOT_RE.test(userAgent)
}

export function shouldSkipView(userAgent: string | null, purpose: string | null): boolean {
  if (purpose && /prefetch/i.test(purpose)) return true
  return isBotUserAgent(userAgent)
}

export function hasLinkSpam(text: string): boolean {
  return LINK_RE.test(text)
}

export function hasProfanity(text: string): boolean {
  return moderateContentBasic(text).hasProfanity
}

function cleanText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
}

export type CommentInput =
  | { ok: true; honeypot: true }
  | {
      ok: true
      honeypot: false
      postId: string
      authorName: string
      content: string
      parentId: string | null
    }
  | { ok: false; error: string }

export function validateCommentBody(body: unknown): CommentInput {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Send a name and a comment.' }
  }
  const record = body as Record<string, unknown>
  const website = typeof record.website === 'string' ? record.website.trim() : ''
  if (website) return { ok: true, honeypot: true }

  const postId = typeof record.postId === 'string' ? record.postId.trim() : ''
  if (!isPostId(postId)) return { ok: false, error: 'That note could not be found.' }

  const rawName = typeof record.authorName === 'string'
    ? record.authorName
    : typeof record.name === 'string'
      ? record.name
      : ''
  const authorName = cleanText(rawName).replace(/\s+/g, ' ').trim()
  if (!authorName) return { ok: false, error: 'Add your name.' }
  if (authorName.length > NAME_MAX) return { ok: false, error: `Name must be ${NAME_MAX} characters or fewer.` }
  if (hasLinkSpam(authorName) || hasProfanity(authorName)) {
    return { ok: false, error: 'Use a plain name — no links.' }
  }

  const content = cleanText(typeof record.content === 'string' ? record.content : '').trim()
  if (!content) return { ok: false, error: 'Write a comment first.' }
  if (content.length > CONTENT_MAX) {
    return { ok: false, error: `Comment must be ${CONTENT_MAX} characters or fewer.` }
  }
  if (hasProfanity(content)) {
    return { ok: false, error: 'Take another pass — that language does not belong here.' }
  }
  if (hasLinkSpam(content)) {
    return { ok: false, error: 'Leave the links out. A sentence is enough.' }
  }

  let parentId: string | null = null
  if (record.parentId != null && record.parentId !== '') {
    if (typeof record.parentId !== 'string' || !VISITOR_ID_RE.test(record.parentId)) {
      return { ok: false, error: 'That reply target is not a comment.' }
    }
    parentId = record.parentId
  }

  return { ok: true, honeypot: false, postId, authorName, content, parentId }
}

export function resolveReplyParent(
  parent: { id: string; post_id: string; parent_id: string | null } | null,
  postId: string,
): { ok: true; parentId: string } | { ok: false; error: string } {
  if (!parent || parent.post_id !== postId) {
    return { ok: false, error: 'That comment is not on this note.' }
  }
  if (parent.parent_id) {
    return { ok: false, error: 'Replies only go one level deep.' }
  }
  return { ok: true, parentId: parent.id }
}

export function threadComments(rows: CommentRow[]): ThreadedComment[] {
  const roots = new Map<string, ThreadedComment>()
  const orderedRoots: ThreadedComment[] = []
  for (const row of rows) {
    if (!row.parent_id) {
      const node: ThreadedComment = { ...row, replies: [] }
      roots.set(row.id, node)
      orderedRoots.push(node)
    }
  }
  for (const row of rows) {
    if (!row.parent_id) continue
    const parent = roots.get(row.parent_id)
    if (parent) parent.replies.push(row)
    else orderedRoots.push({ ...row, replies: [] })
  }
  return orderedRoots
}

export function validateLikeBody(body: unknown):
  | { ok: true; postId: string; action: 'like' | 'unlike' }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'postId required' }
  const record = body as Record<string, unknown>
  const postId = typeof record.postId === 'string' ? record.postId.trim() : ''
  if (!isPostId(postId)) return { ok: false, error: 'postId required' }
  const action = record.action === 'unlike' ? 'unlike' : 'like'
  return { ok: true, postId, action }
}
