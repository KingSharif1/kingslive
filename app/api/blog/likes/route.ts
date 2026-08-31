import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get('postId')
  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }

  const supabase = publicClient()
  const { data, error } = await supabase
    .from('blog_post_analytics')
    .select('likes')
    .eq('post_id', postId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ likes: 0 })
  }
  return NextResponse.json({ likes: data?.likes ?? 0 })
}

export async function POST(request: NextRequest) {
  const { postId } = (await request.json()) as { postId?: string }
  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }

  const supabase = publicClient()
  const { data: existing } = await supabase
    .from('blog_post_analytics')
    .select('likes')
    .eq('post_id', postId)
    .maybeSingle()

  if (existing) {
    const next = (existing.likes || 0) + 1
    const { data } = await supabase
      .from('blog_post_analytics')
      .update({ likes: next, last_updated: new Date().toISOString() })
      .eq('post_id', postId)
      .select('likes')
      .single()
    return NextResponse.json({ likes: data?.likes ?? next })
  }

  const { data } = await supabase
    .from('blog_post_analytics')
    .insert({ post_id: postId, likes: 1, view_count: 0 })
    .select('likes')
    .single()
  return NextResponse.json({ likes: data?.likes ?? 1 })
}
