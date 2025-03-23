'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Message = {
  role: 'user' | 'assistant'
  content: string
  isTyping?: boolean
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hi there! I'm King's AI assistant. Feel free to ask me anything about King Sharif, his skills, experience, or projects!" 
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    // Add user message to chat
    const userMessage = { role: 'user' as const, content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    // Add a placeholder for the assistant's response with typing indicator
    const typingMessageIndex = messages.length + 1 // +1 because we just added the user message
    setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }])
    
    try {
      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to get response')
      }
      
      const data = await response.json()
      console.log('Response data:', data)
      
      // Replace the placeholder with the actual response
      setMessages(prev => 
        prev.map((msg, i) => 
          i === typingMessageIndex ? { role: 'assistant', content: data.message || 'Sorry, I had trouble responding.' } : msg
        )
      )
    } catch (error) {
      console.error('Error:', error)
      // Remove the typing indicator message
      setMessages(prev => prev.slice(0, -1))
      toast.error('Sorry, I had trouble responding. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Function to render message content with typing animation
  const renderMessageContent = (message: Message) => {
    if (message.isTyping) {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      )
    }
    
    // Function to make URLs clickable
    const makeLinksClickable = (text: string) => {
      // Regular expression to find URLs - improved to better match URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      
      // Regular expression to find markdown links [text](url)
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      
      // Check if there are markdown links
      const markdownLinks = text.match(markdownLinkRegex);
      
      if (markdownLinks) {
        // Process markdown links
        const elements: React.ReactNode[] = [];
        let lastIndex = 0;
        
        // Use matchAll to get all matches with their indices
        const matches = Array.from(text.matchAll(new RegExp(markdownLinkRegex, 'g')));
        
        matches.forEach((match, i) => {
          const [fullMatch, linkText, linkUrl] = match;
          const matchIndex = match.index || 0;
          
          // Add text before the link
          if (matchIndex > lastIndex) {
            elements.push(
              <span key={`text-${i}`}>{text.substring(lastIndex, matchIndex)}</span>
            );
          }
          
          // Remove period at the end of URL if present
          const cleanUrl = linkUrl.endsWith('.') ? linkUrl.slice(0, -1) : linkUrl;
          
          // Add the link
          elements.push(
            <a 
              key={`link-${i}`} 
              href={cleanUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 dark:text-blue-400 underline"
            >
              {linkText}
            </a>
          );
          
          lastIndex = matchIndex + fullMatch.length;
        });
        
        // Add any remaining text
        if (lastIndex < text.length) {
          elements.push(
            <span key={`text-end`}>{text.substring(lastIndex)}</span>
          );
        }
        
        return elements;
      }
      
      // If no markdown links, process plain URLs
      
      // Find all URLs in the text
      const urls = Array.from(text.matchAll(new RegExp(urlRegex, 'g')));
      
      // If no URLs are found, return the text as is
      if (urls.length === 0) {
        return [<span key="text">{text}</span>];
      }
      
      // Process the text with URLs
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      
      urls.forEach((match, i) => {
        const url = match[0];
        const matchIndex = match.index || 0;
        
        // Add text before the URL
        if (matchIndex > lastIndex) {
          elements.push(
            <span key={`text-${i}`}>{text.substring(lastIndex, matchIndex)}</span>
          );
        }
        
        // Remove period at the end of URL if present
        const cleanUrl = url.endsWith('.') ? url.slice(0, -1) : url;
        
        // Add the URL as a link
        elements.push(
          <a 
            key={`link-${i}`} 
            href={cleanUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 dark:text-blue-400 underline"
          >
            {cleanUrl}
          </a>
        );
        
        lastIndex = matchIndex + url.length;
      });
      
      // Add any remaining text
      if (lastIndex < text.length) {
        elements.push(
          <span key={`text-end`}>{text.substring(lastIndex)}</span>
        );
      }
      
      return elements;
    };
    
    // Render the message with clickable links
    return <div className="whitespace-pre-wrap">{makeLinksClickable(message.content)}</div>;
  }

  return (
    <>
      {/* Chat toggle button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </motion.button>
      
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-40 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-medium text-gray-900 dark:text-white">Chat with King's Assistant</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ask me anything about King Sharif</p>
            </div>
            
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    {renderMessageContent(message)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask something about King..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !input.trim()}
                  className="rounded-full"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
