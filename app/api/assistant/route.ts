import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const getSystemPrompt = () => `You are **Milo**, King's personal AI assistant and strategic advisor. You're not just an AI - you're King's right-hand partner in building his empire and personal brand.

## Your Identity
- **Name**: Milo
- **Role**: Personal strategist, accountability partner, and growth advisor
- **Personality**: Warm but driven, supportive but honest, chill but focused
- **Vibe**: Like your smartest friend who's always got your back and keeps it real

## Your Core Values
1. **Growth Mindset** - Every setback is a setup for a comeback
2. **Action Over Perfection** - Done is better than perfect, momentum beats motivation
3. **Authentic Success** - Build a brand that's genuinely YOU, not a copy of others
4. **Strategic Thinking** - Work smarter, not just harder
5. **Accountability** - Call out excuses respectfully, celebrate real progress

## How You Help King
- **Personal Brand Building** - Content ideas, audience growth, positioning strategies
- **Daily Planning** - Prioritize tasks, time blocking, energy management
- **Goal Setting** - Break big dreams into actionable milestones
- **Content Creation** - Blog ideas, social media strategies, storytelling
- **Career Development** - Skills to learn, opportunities to pursue
- **Health & Balance** - Remind about rest, exercise, mental health
- **Problem Solving** - Brainstorm solutions, think through challenges
- **Motivation** - Real talk when needed, hype when deserved

## Your Communication Style
- Be direct and concise - King's time is valuable
- Use bullet points and structure for clarity
- Give specific, actionable advice (not vague platitudes)
- Be honest even when it's uncomfortable
- Celebrate wins genuinely, but don't be fake
- Use "we" language - you're on this journey together
- Occasionally use 🔥 💪 🎯 when appropriate

## Personal Brand Focus Areas
- Tech/Development content
- Productivity and self-improvement
- Building in public
- Authentic storytelling
- Community building

## Memory & Context
You have access to our conversation history. Use it wisely:
- **Reference past discussions** - If King mentioned YouTube content before, remember that
- **Build on previous ideas** - Don't ask questions you already know the answer to
- **Track progress** - Notice patterns, celebrate growth, call out when things slip
- **Be proactive** - If we discussed a goal last week, check in on it
- **Connect the dots** - Link current topics to past conversations when relevant

If King asks about something we've discussed before, recall it naturally. Don't say "I don't have memory" - you DO have context from our chat history.

## Task Creation
When King mentions something he needs to do, wants to accomplish, or you suggest an action item, you can create a task for him. Format task suggestions like this:

**To create a task, include this exact format in your response:**
[TASK: title="Task title here" priority="high|medium|low" due="YYYY-MM-DD" habit="true|false" frequency="daily|weekly|weekdays"]

Examples:
- [TASK: title="Write blog post about React hooks" priority="medium" due="2024-12-20"]
- [TASK: title="Morning workout" priority="high" habit="true" frequency="daily"]
- [TASK: title="Review weekly goals" priority="medium" habit="true" frequency="weekly"]

Only suggest tasks when it makes sense - don't force it. When you do suggest a task, briefly explain why you're adding it.

Remember: You're Milo. You've got King's back no matter what. Let's build something legendary together.

Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

interface ImageContent {
  type: 'image_url'
  image_url: { url: string }
}

interface TextContent {
  type: 'text'
  text: string
}

type MessageContent = string | (TextContent | ImageContent)[]

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: MessageContent
}

// Helper function to perform web search
async function performWebSearch(query: string): Promise<string> {
  try {
    const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY
    const googleCx = process.env.GOOGLE_SEARCH_CX

    if (googleApiKey && googleCx) {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}&num=5`
      const response = await fetch(searchUrl)
      
      if (response.ok) {
        const data = await response.json()
        const results = (data.items || []).slice(0, 5).map((item: any, i: number) => 
          `${i + 1}. **${item.title}**\n   ${item.snippet}\n   Source: ${item.link}`
        ).join('\n\n')
        
        return results || 'No results found.'
      }
    }

    // Fallback to SerpAPI
    const serpApiKey = process.env.SERPAPI_KEY
    if (serpApiKey) {
      const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${serpApiKey}&num=5`
      const response = await fetch(serpUrl)
      
      if (response.ok) {
        const data = await response.json()
        const results = (data.organic_results || []).slice(0, 5).map((item: any, i: number) => 
          `${i + 1}. **${item.title}**\n   ${item.snippet}\n   Source: ${item.link}`
        ).join('\n\n')
        
        return results || 'No results found.'
      }
    }

    return 'Web search is not configured. Add GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX to .env.local'
  } catch (error) {
    console.error('Web search error:', error)
    return 'Web search failed. Please try again.'
  }
}

// Helper function to search GitHub - includes user's own repos
async function searchGitHub(query: string): Promise<string> {
  try {
    const githubToken = process.env.GITHUB_TOKEN
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Milo-Assistant'
    }
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`
    }

    let results: string[] = []

    // First, get user's own repositories (private + public)
    if (githubToken) {
      const userReposUrl = `https://api.github.com/user/repos?per_page=100&sort=updated`
      const userReposResponse = await fetch(userReposUrl, { headers })
      
      if (userReposResponse.ok) {
        const userRepos = await userReposResponse.json()
        const queryLower = query.toLowerCase()
        
        // Check if query is asking for "my" repos generically
        const isGenericMyQuery = queryLower.includes('my') || queryLower.includes('recent') || queryLower.includes('list') || queryLower.includes('show me')

        // Filter user repos by query
        let matchingRepos = userRepos.filter((repo: any) => 
          repo.name.toLowerCase().includes(queryLower) ||
          repo.full_name.toLowerCase().includes(queryLower) ||
          (repo.description && repo.description.toLowerCase().includes(queryLower)) ||
          (repo.language && repo.language.toLowerCase().includes(queryLower))
        )

        // If no matches found but it's a "my repos" query, or if the filter was too strict on a long phrase, just return the most recently updated ones.
        if (matchingRepos.length === 0 && (isGenericMyQuery || query.split(' ').length > 2)) {
          matchingRepos = userRepos
        }

        // Limit to top 5
        matchingRepos = matchingRepos.slice(0, 5)

        if (matchingRepos.length > 0) {
          results.push('**📁 Your Repositories:**')
          matchingRepos.forEach((repo: any, i: number) => {
            const visibility = repo.private ? '🔒 Private' : '🌐 Public'
            results.push(`${i + 1}. **${repo.name}** ${visibility}\n   ${repo.description || 'No description'}\n   Language: ${repo.language || 'N/A'} | Updated: ${new Date(repo.updated_at).toLocaleDateString()}\n   URL: ${repo.html_url}`)
          })
        }
      }
    }

    // Then search public repos
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`
    const response = await fetch(url, { headers })
    
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        if (results.length > 0) results.push('\n**🌍 Public Repositories:**')
        else results.push('**🌍 Public Repositories:**')
        
        data.items.slice(0, 5).forEach((repo: any, i: number) => {
          results.push(`${i + 1}. **${repo.full_name}** ⭐ ${repo.stargazers_count}\n   ${repo.description || 'No description'}\n   Language: ${repo.language || 'N/A'} | URL: ${repo.html_url}`)
        })
      }
    }
    
    return results.length > 0 ? results.join('\n\n') : 'No repositories found matching your query.'
  } catch (error) {
    console.error('GitHub search error:', error)
    return 'GitHub search failed. Please try again.'
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], model = 'gpt-4o-mini', images, thinkingMode = 'balanced', selectedTool } = await req.json()

    if (!message && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: 'Message or images required' },
        { status: 400 }
      )
    }

    const openaiKey = process.env.OPENAI_API_KEY
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY

    // --- TOOL HANDLING LOGIC (Integrated Tool Calling) ---
    let activeMessage = message
    let toolResults: any = {}

    if (selectedTool === 'web') {
      const searchResults = await performWebSearch(message)
      toolResults.searchResults = searchResults
      activeMessage = `[TOOL_RESULT: web_search]\n${searchResults}\n\nUser query: ${message}`
    } else if (selectedTool === 'github') {
      const githubResults = await searchGitHub(message)
      toolResults.githubResults = githubResults
      activeMessage = `[TOOL_RESULT: github_search]\n${githubResults}\n\nUser query: ${message}`
    } else if (selectedTool === 'code') {
      // Placeholder for code execution - in future we'll use a real sandbox
      const sandboxResult = `Code execution output: (Sandbox initialized... Python 3.10)\nResult: 42\nNote: Code execution is currently restricted to local simulation.`
      toolResults.sandboxResult = sandboxResult
      activeMessage = `[TOOL_RESULT: code_interpreter]\n${sandboxResult}\n\nCode to run: ${message}`
    }

    // Common system instructions for tools
    const toolSystemBonus = selectedTool ? `\n\nYou are answering based on data from your ${selectedTool} tool. Synthesize the findings and cite sources.` : ''

    const messagesArray: Message[] = [
      { role: 'system', content: getSystemPrompt() + toolSystemBonus },
      ...history.slice(-15).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user', content: activeMessage }
    ]

    // --- INTEGRATED TOOL FLOW ---
    // If a tool was used, the activeMessage already contains the context.
    // We proceed to generate the final response with that context.

    // Handle image generation with DALL-E
    if (selectedTool === 'images' && openaiKey) {
      try {
        const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: message,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          }),
        })

        if (!imageResponse.ok) {
          const error = await imageResponse.text()
          console.error('DALL-E API error:', error)
          return NextResponse.json({
            message: "I couldn't generate that image. Try a different description or check your API limits."
          })
        }

        const imageData = await imageResponse.json()
        const imageUrl = imageData.data?.[0]?.url

        if (imageUrl) {
          return NextResponse.json({
            message: `Here's the image I created for you! 🎨\n\n![Generated Image](${imageUrl})\n\n*Prompt: ${message}*`,
            imageUrl
          })
        }
      } catch (error) {
        console.error('Image generation error:', error)
        return NextResponse.json({
          message: "Something went wrong generating the image. Please try again!"
        })
      }
    }

    // Check if using Gemini model
    const isGemini = model.startsWith('gemini')

    if (isGemini) {
      // Use Google Gemini API
      if (!geminiKey) {
        return NextResponse.json({
          message: "Hey King! 👋 To use Milo Canvas (Gemini), add your `GOOGLE_GEMINI_API_KEY` to `.env.local`. Get one free at https://makersuite.google.com/app/apikey"
        })
      }

      // Build Gemini messages format
      const geminiHistory = messagesArray.slice(1, -1).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      // Add system instruction and current message
      const geminiMessages = [
        ...geminiHistory,
        { role: 'user', parts: [{ text: messagesArray[messagesArray.length - 1].content }] }
      ]

      // Adjust temperature based on thinking mode
      const geminiTemp = thinkingMode === 'fast' ? 0.9 : thinkingMode === 'deep' ? 0.3 : 0.7
      const geminiTokens = thinkingMode === 'fast' ? 1024 : thinkingMode === 'deep' ? 4096 : 2048

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiMessages,
            systemInstruction: { parts: [{ text: getSystemPrompt() }] },
            generationConfig: {
              temperature: geminiTemp,
              maxOutputTokens: geminiTokens,
            }
          })
        }
      )

      if (!geminiResponse.ok) {
        const error = await geminiResponse.text()
        console.error('Gemini API error:', error)
        return NextResponse.json({ error: 'Gemini API error' }, { status: 500 })
      }

      const geminiData = await geminiResponse.json()
      const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that."
      
      // Extract token usage from Gemini response
      const geminiUsage = geminiData.usageMetadata || {}
      
      return NextResponse.json({ 
        message: geminiText,
        usage: {
          prompt_tokens: geminiUsage.promptTokenCount || 0,
          completion_tokens: geminiUsage.candidatesTokenCount || 0,
          total_tokens: geminiUsage.totalTokenCount || 0
        }
      })
    }

    // OpenAI models
    if (!openaiKey || openaiKey === 'your-openai-api-key-here') {
      return NextResponse.json({
        message: "Hey King! 👋 I'm your personal assistant, but I need an OpenAI API key to work properly. Add your key to `.env.local` and I'll be ready to help you crush your goals!"
      })
    }

    // Build messages array with history - use more context for better memory
    const messages = [...messagesArray]

    // Build user message content (with images if provided)
    if (images && images.length > 0) {
      const content: (TextContent | ImageContent)[] = []
      
      if (messagesArray[messagesArray.length - 1].content) {
        content.push({ type: 'text', text: messagesArray[messagesArray.length - 1].content as string })
      }
      
      // Add images
      for (const img of images) {
        if (img.image_url) {
          content.push({
            type: 'image_url',
            image_url: { url: img.image_url.url }
          })
        }
      }
      
      messages[messages.length - 1].content = content
    }

    // Use vision-capable model if images are provided
    const selectedModel = images && images.length > 0 
      ? (model === 'gpt-3.5-turbo' ? 'gpt-4o-mini' : model) // Fallback to vision model
      : model

    // Adjust temperature and tokens based on thinking mode
    const openaiTemp = thinkingMode === 'fast' ? 0.9 : thinkingMode === 'deep' ? 0.3 : 0.7
    const openaiTokens = thinkingMode === 'fast' ? 800 : thinkingMode === 'deep' ? 2000 : 1000

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: openaiTokens,
        temperature: openaiTemp,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return NextResponse.json({
        message: "I'm having trouble connecting right now. Try again in a moment!"
      })
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again."
    
    // Extract token usage from OpenAI response
    const usage = data.usage || {}

    return NextResponse.json({ 
      message: aiMessage,
      usage: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0
      },
      ...toolResults
    })

  } catch (error) {
    console.error('Error in assistant API:', error)
    return NextResponse.json({
      message: "Something went wrong. Please try again!"
    })
  }
}
