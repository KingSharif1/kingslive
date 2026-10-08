import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  SchemaUnavailableError,
  isSchemaMissing,
  type CommentRow,
  type EngagementStore,
  type LikeState,
  type ViewResult,
} from '@/lib/blog/engagement'

type DbError = { code?: string; message?: string } | null

let testOverride: EngagementStore | null = null

/** Vitest injects a store so route tests never touch Supabase. */
export function __setEngagementStoreForTests(store: EngagementStore | null): void {
  testOverride = store
}

export function getEngagementStore(): EngagementStore {
  if (testOverride) return testOverride
  const client = createAdminClient()
  if (!client) throw new SchemaUnavailableError('Supabase service role is not configured')
  return new SupabaseEngagementStore(client)
}

function createAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function raise(error: DbError): never {
  if (isSchemaMissing(error)) throw new SchemaUnavailableError(error?.message)
  throw new Error(error?.message || 'Database error')
}

const COMMENT_COLUMNS = 'id, post_id, parent_id, author_name, content, created_at'

export class SupabaseEngagementStore implements EngagementStore {
  constructor(private readonly db: SupabaseClient) {}

  async listComments(postId: string): Promise<CommentRow[]> {
    const { data, error } = await this.db
      .from('blog_comments')
      .select(COMMENT_COLUMNS)
      .eq('post_id', postId)
      .eq('approved', true)
      .eq('archived', false)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })
      .limit(200)
    if (error) raise(error)
    return (data || []) as CommentRow[]
  }

  async findComment(id: string): Promise<Pick<CommentRow, 'id' | 'post_id' | 'parent_id'> | null> {
    const { data, error } = await this.db
      .from('blog_comments')
      .select('id, post_id, parent_id')
      .eq('id', id)
      .eq('approved', true)
      .eq('archived', false)
      .eq('is_hidden', false)
      .maybeSingle()
    if (error) raise(error)
    return (data as Pick<CommentRow, 'id' | 'post_id' | 'parent_id'> | null) ?? null
  }

  async countCommentsSince(visitorId: string, sinceIso: string): Promise<number> {
    const { count, error } = await this.db
      .from('blog_comments')
      .select('id', { count: 'exact', head: true })
      .eq('visitor_id', visitorId)
      .gte('created_at', sinceIso)
    if (error) raise(error)
    return count ?? 0
  }

  async insertComment(input: {
    postId: string
    parentId: string | null
    authorName: string
    content: string
    visitorId: string
  }): Promise<CommentRow> {
    const { data, error } = await this.db
      .from('blog_comments')
      .insert({
        post_id: input.postId,
        parent_id: input.parentId,
        author_name: input.authorName,
        content: input.content,
        visitor_id: input.visitorId,
        approved: true,
        archived: false,
        is_hidden: false,
      })
      .select(COMMENT_COLUMNS)
      .single()
    if (error) raise(error)
    void this.bumpCommentCount(input.postId)
    return data as CommentRow
  }

  async likeState(postId: string, visitorId: string): Promise<LikeState> {
    const counted = await this.db
      .from('blog_post_likes')
      .select('visitor_id', { count: 'exact', head: true })
      .eq('post_id', postId)
    if (counted.error) {
      if (isSchemaMissing(counted.error)) {
        return { likes: await this.readLegacyLikes(postId), liked: false }
      }
      raise(counted.error)
    }

    const mine = await this.db
      .from('blog_post_likes')
      .select('visitor_id')
      .eq('post_id', postId)
      .eq('visitor_id', visitorId)
      .maybeSingle()
    if (mine.error) raise(mine.error)

    const legacy = await this.readLegacyBase(postId)
    return {
      likes: legacy + (counted.count ?? 0),
      liked: Boolean(mine.data),
    }
  }

  async like(postId: string, visitorId: string): Promise<LikeState> {
    const { error } = await this.db.from('blog_post_likes').insert({
      post_id: postId,
      visitor_id: visitorId,
    })
    if (error && error.code !== '23505') raise(error)
    const state = await this.likeState(postId, visitorId)
    void this.writeLikeTotal(postId, state.likes)
    return state
  }

  async unlike(postId: string, visitorId: string): Promise<LikeState> {
    const { error } = await this.db
      .from('blog_post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('visitor_id', visitorId)
    if (error) raise(error)
    const state = await this.likeState(postId, visitorId)
    void this.writeLikeTotal(postId, state.likes)
    return state
  }

  async recordView(postId: string, visitorId: string, now: Date): Promise<ViewResult> {
    // The SQL function stamps the hit with database now(). `now` is the clock the
    // in-memory store uses in tests; both follow shouldCountView's 24h rule.
    void now
    const { data, error } = await this.db.rpc('record_blog_view', {
      p_post_id: postId,
      p_visitor_id: visitorId,
    })
    if (error) raise(error)
    const payload = (data ?? {}) as { counted?: boolean; views?: number }
    return {
      counted: Boolean(payload.counted),
      views: typeof payload.views === 'number' ? payload.views : 0,
    }
  }

  private async readLegacyLikes(postId: string): Promise<number> {
    const { data, error } = await this.db
      .from('blog_post_analytics')
      .select('likes')
      .eq('post_id', postId)
      .maybeSingle()
    if (error || !data) return 0
    const likes = (data as { likes?: number }).likes
    return typeof likes === 'number' ? likes : 0
  }

  private async readLegacyBase(postId: string): Promise<number> {
    const withLegacy = await this.db
      .from('blog_post_analytics')
      .select('legacy_likes')
      .eq('post_id', postId)
      .maybeSingle()
    if (!withLegacy.error) {
      const value = (withLegacy.data as { legacy_likes?: number | null } | null)?.legacy_likes
      return typeof value === 'number' ? value : 0
    }
    if (!isSchemaMissing(withLegacy.error)) return 0
    return this.readLegacyLikes(postId)
  }

  private async writeLikeTotal(postId: string, total: number): Promise<void> {
    const existing = await this.db
      .from('blog_post_analytics')
      .select('post_id')
      .eq('post_id', postId)
      .maybeSingle()
    if (existing.error) return
    if (existing.data) {
      await this.db
        .from('blog_post_analytics')
        .update({ likes: total, last_updated: new Date().toISOString() })
        .eq('post_id', postId)
      return
    }
    await this.db.from('blog_post_analytics').insert({
      post_id: postId,
      likes: total,
      view_count: 0,
      legacy_likes: 0,
      last_updated: new Date().toISOString(),
    })
  }

  private async bumpCommentCount(postId: string): Promise<void> {
    const existing = await this.db
      .from('blog_post_analytics')
      .select('comment')
      .eq('post_id', postId)
      .maybeSingle()
    if (existing.error || !existing.data) return
    const current = (existing.data as { comment?: number | null }).comment
    await this.db
      .from('blog_post_analytics')
      .update({
        comment: (typeof current === 'number' ? current : 0) + 1,
        last_updated: new Date().toISOString(),
      })
      .eq('post_id', postId)
  }
}
