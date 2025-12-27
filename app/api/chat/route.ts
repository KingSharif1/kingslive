import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import { HfInference } from '@huggingface/inference'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const customSearch = google.customsearch('v1')

// KING_INFO for context
const KING_INFO = {
  name: 'King Sharif',
  profession: 'Creative Developer & UX Engineer',
  skills: ['Next.js', 'React', 'TailwindCSS', 'Three.js', 'AI Integration', 'Supabase'],
  location: 'Chicago, IL',
  portfolio: 'https://kingsharif.com',
  interests: ['AI Agents', 'Minimalist Design', 'Creative Coding']
}

export async function POST(req: Request) {
  try {
    const { messages, model, thinkingMode, tools } = await req.json()
    const lastMessage = messages[messages.length - 1]
    const query = lastMessage.content

    // Initialize thinking steps
    const thinkingSteps = []
    
    // 1. Analyze Intent
    thinkingSteps.push({ title: 'Analyzing Request', status: 'completed', description: `Model: ${model}, Mode: ${thinkingMode}` })

    let context = `You are Malo, King Sharif's advanced AI assistant (Jarvis-like).
You are smart, precise, and have access to tools.
Current User Context: ${JSON.stringify(KING_INFO)}
`

    // 2. Web Search
    const needsSearch = tools?.includes('web') && 
      (query.toLowerCase().includes('search') || 
       query.toLowerCase().includes('google') || 
       query.toLowerCase().includes('find') || 
       query.toLowerCase().includes('current') ||
       query.toLowerCase().includes('news') ||
       (query.length > 20 && query.includes('?')))

    let searchResults = ''
    if (needsSearch) {
      thinkingSteps.push({ title: 'Searching Web', status: 'pending', description: `Query: ${query}` })
      try {
        const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY
        const cx = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CX
        
        if (!apiKey || !cx) throw new Error('Keys missing')

        const res = await customSearch.cse.list({ cx, q: query, auth: apiKey, num: 5 })

        if (res.data.items) {
            searchResults = res.data.items.map((item: any) => `- [${item.title}](${item.link}): ${item.snippet}`).join('\n')
            context += `\n\nWeb Search Results:\n${searchResults}\n\n`
            thinkingSteps[thinkingSteps.length - 1].status = 'completed'
            thinkingSteps[thinkingSteps.length - 1].description = `Found ${res.data.items.length} results`
        } else {
             thinkingSteps[thinkingSteps.length - 1].status = 'failed'
             thinkingSteps[thinkingSteps.length - 1].description = 'No results'
        }
      } catch (error) {
        console.error('Search error:', error)
        thinkingSteps[thinkingSteps.length - 1].status = 'failed'
        thinkingSteps[thinkingSteps.length - 1].description = 'Search unavailable'
      }
    }

    // 3. Notes Access
    if (query.toLowerCase().includes('idea') || query.toLowerCase().includes('note')) {
        thinkingSteps.push({ title: 'Checking Notes', status: 'pending', description: 'Querying Supabase...' })
        const { data: notes } = await supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(5)
        if (notes) {
            context += `\n\nRecent Notes:\n${JSON.stringify(notes)}\n\n`
            thinkingSteps[thinkingSteps.length - 1].status = 'completed'
            thinkingSteps[thinkingSteps.length - 1].description = `Retrieved ${notes.length} notes`
        }
    }

    // 4. Generate Response (Multi-Provider)
    thinkingSteps.push({ title: 'Formulating Answer', status: 'pending', description: `Using ${model}` })
    
    const sysPrompt = `${context}\n\nUser: ${query}`
    let generatedText = ""

    // Provider Logic
    if (model.startsWith('gpt') && process.env.OPENAI_API_KEY) {
        // OpenAI
        try {
            const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: model, // e.g. gpt-4o
                    messages: [
                        { role: 'system', content: context },
                        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
                    ],
                    max_tokens: 1000
                })
            })
            const data = await resp.json()
            generatedText = data.choices?.[0]?.message?.content || "OpenAI Response Error"
        } catch (e) {
            console.error(e)
            generatedText = "Error communicating with OpenAI."
        }
    } else if (model.includes('gemini') && process.env.GOOGLE_GEMINI_API_KEY) {
        // Google Gemini
        try {
            // Map model ID to Gemini equivalent if needed, or use direct
            // gemini-2.0-flash is valid if available, otherwise gemini-1.5-flash
            const geminiModel = model.includes('flash') ? 'gemini-1.5-flash' : 'gemini-pro' 
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`
            
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: sysPrompt }] }]
                })
            })
            const data = await resp.json()
            generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini Response Error"
        } catch (e) {
            console.error(e)
            generatedText = "Error communicating with Gemini."
        }
    } else {
        // Fallback to Hugging Face
        try {
            const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)
            const response = await hf.textGeneration({
                model: 'mistralai/Mistral-7B-Instruct-v0.3', 
                inputs: sysPrompt,
                parameters: { max_new_tokens: 500, return_full_text: false }
            })
            generatedText = response.generated_text
        } catch (e) {
            generatedText = "I'm having trouble connecting to my brain. (Check API Keys)"
        }
    }

    thinkingSteps[thinkingSteps.length - 1].status = 'completed'

    return NextResponse.json({
      role: 'assistant',
      content: generatedText,
      thinking: thinkingSteps
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
