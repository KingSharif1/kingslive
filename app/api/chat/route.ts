import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import { HfInference } from '@huggingface/inference'

const customSearch = google.customsearch('v1')

// Helper function to estimate tokens (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// Helper function to track token usage
async function trackTokenUsage(provider: string, model: string, inputText: string, outputText: string) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const totalTokens = estimateTokens(inputText) + estimateTokens(outputText)

        await supabase.from('token_usage').insert([{
            user_id: user.id,
            provider,
            model,
            tokens: totalTokens,
            request_type: 'chat'
        }])
    } catch (error) {
        console.error('Error tracking token usage:', error)
    }
}

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
<<<<<<< Updated upstream
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
        
        // Initialize Supabase client only when needed
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        const { data: notes } = await supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(5)
        if (notes) {
            context += `\n\nRecent Notes:\n${JSON.stringify(notes)}\n\n`
            thinkingSteps[thinkingSteps.length - 1].status = 'completed'
            thinkingSteps[thinkingSteps.length - 1].description = `Retrieved ${notes.length} notes`
        }
    }

    // 4. Generate Response (Multi-Provider)
    thinkingSteps.push({ title: 'Formulating Answer', status: 'pending', description: `Using ${model}` })
=======
    const { message } = await req.json()
    
<<<<<<< Updated upstream
    // Check if the message is valid
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      )
    }

    // Handle greetings differently
    if (isGreeting(message)) {
      return NextResponse.json({ 
        message: "Hi there! 👋 What would you like to know about King Sharif? I can tell you about his skills, projects, education, or interests."
      })
    }
=======
    // 1. Analyze Intent
    thinkingSteps.push({ title: 'Analyzing Request', status: 'completed', description: `Model: ${model}, Tool: ${tools?.[0] || 'None'}` })

    let context = `You are Malo, King Sharif's advanced AI assistant (Jarvis-like).
You are smart, precise, and have access to tools.
Current User Context: ${JSON.stringify(KING_INFO)}
`

    // 2. Web Search
    const needsSearch = tools?.includes('search-web') || tools?.includes('web') || 
      (query.toLowerCase().includes('search') && !query.toLowerCase().includes('github'))

    if (needsSearch) {
      thinkingSteps.push({ title: 'Searching Web', status: 'pending', description: `Query: ${query}` })
      try {
        const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY
        const cx = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CX
        
        if (!apiKey || !cx) throw new Error('Keys missing')

        const res = await customSearch.cse.list({ cx, q: query, auth: apiKey, num: 5 })

        if (res.data.items) {
            const searchResults = res.data.items.map((item: any) => `- [${item.title}](${item.link}): ${item.snippet}`).join('\n')
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

    // 3. GitHub Integration
    const needsGithub = tools?.includes('github') || query.toLowerCase().includes('github')
    
    if (needsGithub) {
        thinkingSteps.push({ title: 'Checking GitHub', status: 'pending', description: 'Accessing repositories...' })
        try {
            const githubToken = process.env.GITHUB_TOKEN
            if (!githubToken) throw new Error('GitHub Token missing')

            // Default to listing repos if no specific query
            // In a real agent, we would parse specific intent (search code, list prs, etc)
            const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=5', {
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            })

            if (res.ok) {
                const repos = await res.json()
                const repoList = repos.map((r: any) => `- [${r.name}](${r.html_url}): ${r.description || 'No description'} (Language: ${r.language})`).join('\n')
                context += `\n\nRecent GitHub Repositories:\n${repoList}\n\n`
                thinkingSteps[thinkingSteps.length - 1].status = 'completed'
                thinkingSteps[thinkingSteps.length - 1].description = `Found ${repos.length} recent repos`
            } else {
                thinkingSteps[thinkingSteps.length - 1].status = 'failed'
                thinkingSteps[thinkingSteps.length - 1].description = 'Failed to fetch repos'
            }
        } catch (error) {
            console.error('GitHub error:', error)
            thinkingSteps[thinkingSteps.length - 1].status = 'failed'
            thinkingSteps[thinkingSteps.length - 1].description = 'GitHub unavailable'
        }
    }
    
    // 4. Notes Access (Supabase) - Keep existing logic if relevant
    if (query.toLowerCase().includes('idea') || query.toLowerCase().includes('note')) {
        // ... (existing notes logic if needed, suppressing for space if not core to this task, but user liked it before so keeping simplified)
         // Initialize Supabase only if needed
         if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
            const { data: notes } = await supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(3)
            if (notes && notes.length > 0) {
               context += `\n\nRecent Notes:\n${JSON.stringify(notes)}\n\n`
            }
         }
    }

    // 5. Generate Response (Multi-Provider)
    thinkingSteps.push({ title: 'Formulating Answer', status: 'pending', description: `Using ${model}` })
>>>>>>> Stashed changes
    
    // Create a prompt for the AI
    const prompt = `You are a friendly assistant for King Sharif's portfolio website. You should be concise, friendly, and helpful. Your responses should be short (1-3 sentences max) unless the user specifically asks for more detail.

<<<<<<< Updated upstream
Here's some information about King Sharif:
${JSON.stringify(KING_INFO)}

User: ${message}
Assistant:`
    
    console.log('Sending request to Hugging Face API...')
    
    // Fallback response in case API fails
    let aiMessage = "I'm sorry, I couldn't process your request at the moment. King Sharif is a full-stack developer with expertise in React, Next.js, and TypeScript. Feel free to explore his portfolio or ask another question!"
    
    try {
      // Call Hugging Face API with a simple model that should be available
      const response = await hf.textGeneration({
        model: 'gpt2', // Using a very basic model that should be available
        inputs: prompt,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.5,
          top_p: 0.9,
          repetition_penalty: 1.2,
          do_sample: true,
          return_full_text: false
=======
    // Provider Logic
    if (model.startsWith('gpt') && process.env.OPENAI_API_KEY) {
        // OpenAI
        try {
            const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
                body: JSON.stringify({
                    model: model, 
                    messages: [
                        { role: 'system', content: context },
                        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
                    ],
                    max_tokens: 1000
                })
            })
            const data = await resp.json()
            generatedText = data.choices?.[0]?.message?.content || "OpenAI Response Error"
            await trackTokenUsage('OpenAI', model, query, generatedText)
        } catch (e) {
            console.error(e)
            generatedText = "Error communicating with OpenAI."
        }
    } else if (model.includes('gemini') && process.env.GOOGLE_GEMINI_API_KEY) {
        // Google Gemini
        try {
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
            await trackTokenUsage('Google', geminiModel, query, generatedText)
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
            await trackTokenUsage('HuggingFace', 'mistralai/Mistral-7B-Instruct-v0.3', query, generatedText)
        } catch (e) {
            generatedText = "I'm having trouble connecting to my brain. (Check API Keys)"
>>>>>>> Stashed changes
        }
      })
      
      console.log('Response received:', response)
      
      // Extract the AI's response and clean it up
      aiMessage = response.generated_text.trim()
    } catch (apiError) {
      console.error('Hugging Face API error details:', apiError)
      // Continue with fallback response
    }
    
    // Remove any potential instruction tokens that might be in the response
    aiMessage = aiMessage.replace(/<s>|\[INST\]|\[\/INST\]|<\/s>/g, '').trim()
    
    // Remove phrases like "I am an AI assistant for King Sharif" or similar introductions
    aiMessage = aiMessage.replace(/^(I am|I'm) an AI assistant for King Sharif\.?\s*/i, '')
    aiMessage = aiMessage.replace(/^As an AI assistant for King Sharif,?\s*/i, '')
    
    // Format links to be clickable
    aiMessage = formatLinks(aiMessage)
    
    console.log('Cleaned message:', aiMessage)
    
    return NextResponse.json({ message: aiMessage || "I don't have that information about King." })
    
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
