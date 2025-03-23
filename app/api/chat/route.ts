import { HfInference } from '@huggingface/inference'
import { NextRequest, NextResponse } from 'next/server'
import { KING_INFO } from './king-info'

// Initialize Hugging Face client
const hf = new HfInference(process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY)

// Check if a message is a greeting
function isGreeting(message: string) {
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'howdy', 'hola', 'sup', 'yo', 'good morning', 'good afternoon', 'good evening', 'what\'s up', 'whats up']
  const lowercaseMessage = message.toLowerCase().trim()
  return greetings.some(greeting => lowercaseMessage === greeting || lowercaseMessage.startsWith(greeting + ' '))
}

// Format links to be clickable by removing angle brackets and markdown formatting
function formatLinks(text: string): string {
  // Replace <https://...> with https://...
  let formattedText = text.replace(/<(https?:\/\/[^>]+)>/g, '$1');
  
  // Replace markdown links [text](url) with just the url
  formattedText = formattedText.replace(/\[(?:https?:\/\/[^\]]+)\]\(([^)]+)\)/g, '$1');
  
  // Fix duplicate URLs (e.g., "https://example.com https://example.com" or "https://example.com/https://example.com")
  formattedText = formattedText.replace(/(https?:\/\/[^\s]+)\s*\1/g, '$1');
  formattedText = formattedText.replace(/(https?:\/\/[^\s]+)\/(https?:\/\/[^\s]+)/g, '$1');
  
  // Remove periods at the end of URLs
  formattedText = formattedText.replace(/(https?:\/\/[^\s]+)\.(\s|$)/g, '$1$2');
  
  return formattedText;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    
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
    
    // Create the prompt for the AI model
    const prompt = `<s>[INST] You are an AI assistant for King Sharif. Your task is to answer questions about King based on the information provided below. Be friendly and conversational, but keep responses concise (1-2 sentences). Answer directly what was asked. Don't introduce yourself in every response - the user already knows who you are. If asked about "King" or "Sharif", assume they're asking about King Sharif. If you don't know the answer, just say "I don't have that information about King."

When including links (like LinkedIn, GitHub, or website URLs), don't write the full URL in text - just use descriptive text like "LinkedIn profile" or "contact page" and format it as a link. For example, write "check out his [LinkedIn profile](https://www.linkedin.com/in/king-sharif/)" instead of "check out his LinkedIn at https://www.linkedin.com/in/king-sharif/".

Here is information about King Sharif:
${KING_INFO}

The user's question is: ${message} [/INST]</s>`
    
    console.log('Sending request to Hugging Face API...')
    
    // Call Hugging Face API
    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.5,
        top_p: 0.9,
        repetition_penalty: 1.2,
        do_sample: true,
        return_full_text: false
      }
    })
    
    console.log('Response received:', response)
    
    // Extract the AI's response and clean it up
    let aiMessage = response.generated_text.trim()
    
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
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    )
  }
}
