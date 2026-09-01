import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPostBySlug } from '@/lib/sanity-queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { isEnabled } = await draftMode()
  const post = await getPostBySlug(slug, { preview: isEnabled })
  if (!post) {
    return NextResponse.json({ post: null, preview: isEnabled }, { status: 404 })
  }
  return NextResponse.json({ post, preview: isEnabled })
}
