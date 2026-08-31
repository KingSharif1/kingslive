import { NextResponse } from 'next/server'
import { getPublishedPosts } from '@/lib/sanity-queries'

export const revalidate = 60

export async function GET() {
  const posts = await getPublishedPosts()
  return NextResponse.json({ posts })
}
