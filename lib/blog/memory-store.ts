import {
  SchemaUnavailableError,
  shouldCountView,
  type CommentRow,
  type EngagementStore,
  type LikeState,
  type ViewResult,
} from '@/lib/blog/engagement'

/**
 * In-memory stand-in for the Supabase store. View dedupe calls the same
 * shouldCountView rule the SQL function implements.
 */
export function createMemoryStore(options?: { unavailable?: boolean }): EngagementStore & {
  reset: () => void
  comments: CommentRow[]
} {
  const comments: CommentRow[] = []
  const commentVisitors = new Map<string, { visitorId: string; createdAt: string }>()
  const likes = new Map<string, Set<string>>()
  const legacyLikes = new Map<string, number>()
  const viewHits = new Map<string, number>()
  const viewCounts = new Map<string, number>()
  let seq = 0

  const guard = () => {
    if (options?.unavailable) throw new SchemaUnavailableError()
  }

  const likeTotal = (postId: string): LikeState['likes'] =>
    (legacyLikes.get(postId) ?? 0) + (likes.get(postId)?.size ?? 0)

  const store: EngagementStore & { reset: () => void; comments: CommentRow[] } = {
    comments,
    reset() {
      comments.splice(0, comments.length)
      commentVisitors.clear()
      likes.clear()
      legacyLikes.clear()
      viewHits.clear()
      viewCounts.clear()
      seq = 0
    },
    async listComments(postId) {
      guard()
      return comments
        .filter((row) => row.post_id === postId)
        .slice()
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    },
    async findComment(id) {
      guard()
      const row = comments.find((item) => item.id === id)
      if (!row) return null
      return { id: row.id, post_id: row.post_id, parent_id: row.parent_id }
    },
    async countCommentsSince(visitorId, sinceIso) {
      guard()
      let count = 0
      for (const meta of commentVisitors.values()) {
        if (meta.visitorId === visitorId && meta.createdAt >= sinceIso) count += 1
      }
      return count
    },
    async insertComment(input) {
      guard()
      seq += 1
      const row: CommentRow = {
        id: `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`,
        post_id: input.postId,
        parent_id: input.parentId,
        author_name: input.authorName,
        content: input.content,
        created_at: new Date().toISOString(),
      }
      comments.push(row)
      commentVisitors.set(row.id, { visitorId: input.visitorId, createdAt: row.created_at })
      return row
    },
    async likeState(postId, visitorId) {
      guard()
      return { likes: likeTotal(postId), liked: likes.get(postId)?.has(visitorId) ?? false }
    },
    async like(postId, visitorId) {
      guard()
      const set = likes.get(postId) ?? new Set<string>()
      set.add(visitorId)
      likes.set(postId, set)
      return { likes: likeTotal(postId), liked: true }
    },
    async unlike(postId, visitorId) {
      guard()
      likes.get(postId)?.delete(visitorId)
      return { likes: likeTotal(postId), liked: false }
    },
    async recordView(postId, visitorId, now): Promise<ViewResult> {
      guard()
      const key = `${postId}\0${visitorId}`
      const last = viewHits.get(key)
      const counted = shouldCountView(last == null ? null : new Date(last), now)
      if (counted) {
        viewHits.set(key, now.getTime())
        viewCounts.set(postId, (viewCounts.get(postId) ?? 0) + 1)
      }
      return { views: viewCounts.get(postId) ?? 0, counted }
    },
  }

  return store
}
