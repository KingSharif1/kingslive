'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Message = {
  role: 'user' | 'assistant'
  content: string
  isTyping?: boolean
  timestamp?: Date
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Maximum number of messages to keep in history
  const MAX_MESSAGES = 50

  // Function to clear chat history
  const clearChat = () => {
    setMessages([]);
    // Optional: Save empty chat to localStorage
    localStorage.setItem('chatHistory', JSON.stringify([]));
  }

  // Load chat history from localStorage on initial render
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error('Failed to parse chat history:', error);
      }
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

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

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message to chat
    const userMessage: Message = { 
      role: 'user', 
      content: input.trim(),
      timestamp: new Date()
    }
    
    // Create a new array with limited history
    const updatedMessages = [...messages, userMessage];
    if (updatedMessages.length > MAX_MESSAGES) {
      // Remove oldest messages if we exceed the limit
      updatedMessages.splice(0, updatedMessages.length - MAX_MESSAGES);
    }
    setMessages(updatedMessages);
    
    setInput('')
    setIsLoading(true)
    setLastError(null)
    setRetryCount(0)

    // Add a typing indicator message
    const typingMessage: Message = { 
      role: 'assistant', 
      content: '', 
      isTyping: true,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      await sendMessageToAPI(input.trim())
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Update the typing message to show the error
      setMessages(prev => 
        prev.map((msg, i) => 
          i === prev.length - 1 ? 
          { 
            role: 'assistant', 
            content: 'Sorry, I encountered an error. Please try again or check your connection.' 
          } : msg
        )
      )
      
      // Store the error message
      setLastError(error instanceof Error ? error.message : 'Unknown error occurred')
      
      // Show error toast
      toast.error('Failed to get a response. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Function to retry sending the last message
  const retryLastMessage = async () => {
    if (retryCount >= 3) {
      toast.error('Maximum retry attempts reached. Please try again later.')
      return
    }
    
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')
    if (!lastUserMessage) return
    
    setIsLoading(true)
    setRetryCount(prev => prev + 1)
    
    // Add a new typing indicator
    const typingMessage: Message = { 
      role: 'assistant', 
      content: '', 
      isTyping: true,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, typingMessage])
    
    try {
      await sendMessageToAPI(lastUserMessage.content)
    } catch (error) {
      console.error('Error retrying message:', error)
      
      // Update the typing message to show the error
      setMessages(prev => 
        prev.map((msg, i) => 
          i === prev.length - 1 ? 
          { 
            role: 'assistant', 
            content: `Retry failed (${retryCount + 1}/3). ${error instanceof Error ? error.message : 'Unknown error occurred'}` 
          } : msg
        )
      )
      
      // Show error toast
      toast.error(`Retry attempt ${retryCount + 1}/3 failed.`)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to send message to API (extracted to avoid code duplication)
  const sendMessageToAPI = async (messageContent: string) => {
    // Calculate a realistic typing delay based on message length
    // This simulates the AI "thinking" and typing at a realistic pace
    const minDelay = 500;  // Minimum delay in ms
    const typingSpeed = 10; // ms per character
    const thinkingTime = Math.min(2000, messageContent.length * 3); // Simulated "thinking" time, max 2 seconds
    
    // Send message to API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageContent }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error (${response.status}): ${errorText || 'No error details available'}`)
    }

    const data = await response.json()
    
    if (!data.message) {
      throw new Error('Received empty response from API')
    }
    
    // Calculate a realistic typing delay
    const responseLength = data.message.length;
    const typingDelay = Math.max(minDelay, Math.min(thinkingTime + (responseLength * typingSpeed), 5000));
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    // Replace the placeholder with the actual response
    setMessages(prev => 
      prev.map((msg, i) => 
        i === prev.length - 1 ? { role: 'assistant', content: data.message, timestamp: new Date() } : msg
      )
    )
    
    return data
  }

  // Function to format timestamp
  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if the date is today
    if (date >= today) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if the date is yesterday
    if (date >= yesterday && date < today) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise, show the full date
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to render message content with typing animation
  const renderMessageContent = (message: Message) => {
    if (message.isTyping) {
      return (
        <div className="typing-indicator">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-gray-400">King is typing...</span>
          </div>
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
    <div className="fixed bottom-0 right-4 z-50 flex flex-col items-end">
      {/* Chat window */}
      {isOpen ? (
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-lg w-80 sm:w-96 overflow-hidden flex flex-col"
          style={{ height: '500px', maxHeight: '80vh' }}
        >
          {/* Chat header */}
          <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 flex justify-between items-center rounded-t-2xl">
            <h3 className="font-medium">Chat with King's Assistant</h3>
            <div className="flex space-x-3">
              <button
                onClick={clearChat}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Clear chat"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 my-8">
                  <p>Ask me anything about King Sharif</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-tr-none'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                      }`}
                    >
                      {renderMessageContent(message)}
                      
                      {/* Show retry button for error messages */}
                      {message.role === 'assistant' && 
                       message.content.includes('Sorry, I encountered an error') && 
                       !isLoading && (
                        <button 
                          onClick={retryLastMessage}
                          className="text-xs underline mt-2 text-blue-400 hover:text-blue-300"
                          disabled={retryCount >= 3}
                        >
                          Retry ({retryCount}/3)
                        </button>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    {message.timestamp && (
                      <div 
                        className={`text-xs text-gray-400 mt-1 ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatTimestamp(message.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Chat input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something about King..."
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
                ref={inputRef}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                className={`p-2 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center ${
                  isLoading || !input.trim() 
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                aria-label="Send message"
              >
                <Send size={18} />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-4">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
            aria-label="Open chat"
          >
            <MessageCircle size={24} />
          </button>
        </div>
      )}
    </div>
  )
}
