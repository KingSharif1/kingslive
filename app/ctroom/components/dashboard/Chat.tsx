"use client"

import { useState, useRef, useEffect } from "react"
import { Send, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How can I help you with your blog today?",
      sender: "assistant",
      timestamp: new Date(Date.now() - 60000)
    }
  ])
  
  const [inputValue, setInputValue] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])
  
  const sendMessage = () => {
    if (inputValue.trim() === "") return
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    
    // Simulate assistant response after a delay
    setTimeout(() => {
      const responses = [
        "I can help you with that! Would you like me to suggest some ideas for your next blog post?",
        "That's a great question. Let me think about how to approach this topic.",
        "I've analyzed your recent posts, and I think your readers would enjoy content about this subject.",
        "Have you considered writing a series on this topic? It could drive more engagement.",
        "Based on your analytics, posts with similar themes have performed well with your audience."
      ]
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        sender: "assistant",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
    }, 1000)
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle>Content Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4 mb-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className={message.sender === "user" ? "bg-primary" : "bg-muted"}>
                    <AvatarFallback>
                      {message.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div 
                      className={`rounded-lg p-3 ${
                        message.sender === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage()
            }}
            className="flex-1"
          />
          <Button onClick={sendMessage} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
