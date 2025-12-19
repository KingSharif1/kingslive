import { HfInference } from '@huggingface/inference'
import { NextRequest, NextResponse } from 'next/server'
import { KING_INFO } from './king-info'

// Force this route to be server-side only
export const runtime = 'nodejs'

// Initialize Hugging Face client
const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || '';
// Log partial key for debugging (first 4 chars only)
console.log(`Using HF API key starting with: ${apiKey.substring(0, 4)}...`);
const hf = new HfInference(apiKey)

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
    
    // Create a prompt for the AI
    const prompt = `You are a friendly assistant for King Sharif's portfolio website. You should be concise, friendly, and helpful. Your responses should be short (1-3 sentences max) unless the user specifically asks for more detail.

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
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    )
  }
}
