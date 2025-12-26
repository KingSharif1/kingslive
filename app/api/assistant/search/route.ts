import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface SearchResult {
  title: string
  link: string
  snippet: string
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    // Try Google Custom Search API - uses GEMINI_API_KEY (same key works for both)
    const googleApiKey = process.env.GEMINI_API_KEY
    const googleCx = process.env.GOOGLE_SEARCH_CX

    if (googleApiKey && googleCx) {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=5`
      
      const response = await fetch(searchUrl)
      
      if (response.ok) {
        const data = await response.json()
        const results: SearchResult[] = (data.items || []).map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet
        }))
        
        return NextResponse.json({ results, source: 'google' })
      }
    }

    // Fallback to SerpAPI if available
    const serpApiKey = process.env.SERPAPI_KEY

    if (serpApiKey) {
      const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=5`
      
      const response = await fetch(serpUrl)
      
      if (response.ok) {
        const data = await response.json()
        const results: SearchResult[] = (data.organic_results || []).slice(0, 5).map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet
        }))
        
        return NextResponse.json({ results, source: 'serpapi' })
      }
    }

    // No API keys configured
    return NextResponse.json({ 
      error: 'Web search not configured. Add GOOGLE_SEARCH_CX to .env.local (uses GEMINI_API_KEY)',
      results: []
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
