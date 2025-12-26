"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Trash2, Loader2, Plus, MessageSquare, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Paperclip, X, FileText, ChevronDown, Zap, Brain, Cpu, Search, Check, Pencil, XCircle, Copy, Image as ImageIcon, Undo2, Settings2, Lightbulb, Gauge, Rocket, Code2, ImagePlus, Wrench, Play, Eye, Code, ArrowLeft, Menu, Home, Calendar, Bookmark, LayoutDashboard } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"

interface Message {
  id: string
  session_id: string
  content: string
  role: "user" | "assistant"
  created_at: string
  attachments?: { name: string; type: string; url: string }[]
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface Attachment {
  name: string
  type: string
  url: string
  file?: File
}

// Thinking modes (like Gemini)
const THINKING_MODES = [
  { id: 'fast', name: 'Fast', icon: Zap },
  { id: 'balanced', name: 'Balanced', icon: Gauge },
  { id: 'deep', name: 'Deep Think', icon: Lightbulb },
]

// Models with their capabilities
const MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', tools: ['vision', 'code', 'web', 'github'], description: 'Fast & affordable, great for most tasks', contextWindow: '128K', icon: '⚡' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tools: ['vision', 'code', 'images', 'web', 'github'], description: 'Most capable, best for complex reasoning', contextWindow: '128K', icon: '🧠' },
  { id: 'gemini-2.0-flash', name: 'Gemini Flash', provider: 'Google', tools: ['vision', 'code', 'web', 'github'], description: 'Google\'s fast multimodal model', contextWindow: '1M', icon: '✨' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini Lite', provider: 'Google', tools: ['vision', 'code', 'web', 'github'], description: 'Lightweight, quick responses', contextWindow: '1M', icon: '💨' },
]

// Tools (shown based on model capabilities)
const AI_TOOLS = [
  { id: 'vision', name: 'Analyze images', icon: ImageIcon },
  { id: 'code', name: 'Write code', icon: Code2 },
  { id: 'images', name: 'Create images', icon: ImagePlus },
  { id: 'web', name: 'Search web', icon: Search },
  { id: 'github', name: 'GitHub', icon: Code },
]

interface TaskSuggestion {
  id: string
  title: string
  priority: string
  dueDate?: string
  isHabit: boolean
  frequency?: string
  status: 'pending' | 'accepted' | 'rejected' | 'editing'
  editedTitle?: string
}

interface ThinkingStep {
  id: string
  type: 'thinking' | 'searching' | 'browsing' | 'coding' | 'done'
  content: string
  timestamp: number
}

const QUICK_PROMPTS = [
  { text: "What should I focus on today?", icon: "🎯", category: "Planning" },
  { text: "Help me plan my week", icon: "📅", category: "Planning" },
  { text: "Content ideas for my brand", icon: "✨", category: "Content" },
  { text: "Review my progress on goals", icon: "🏆", category: "Goals" },
  { text: "Give me some real talk", icon: "💪", category: "Motivation" },
  { text: "Let's brainstorm something", icon: "💡", category: "Creative" },
]

export function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([])
  const [thinkingMode, setThinkingMode] = useState('balanced')
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0 })
  const [showThinking, setShowThinking] = useState(true)
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [codePreview, setCodePreview] = useState<{ code: string; language: string; isOpen: boolean }>({ code: '', language: '', isOpen: false })
  const [previewTab, setPreviewTab] = useState<'preview' | 'code'>('preview')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()

  // Navigation items for sidebar
  const NAV_ITEMS = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: Calendar },
    { id: 'ideas', label: 'Ideas', icon: Bookmark },
    { id: 'chat', label: 'Assistant', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ]

  // Get current model and its available tools
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0]
  const availableTools = AI_TOOLS.filter(t => currentModel.tools.includes(t.id))
  const currentThinkingMode = THINKING_MODES.find(m => m.id === thinkingMode) || THINKING_MODES[1]

  // Check for mobile on mount and fetch sessions
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setShowSidebar(true)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    fetchSessions()
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const fetchSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching sessions:', error)
        // Table might not exist - that's okay, just show empty state
        setSessions([])
        return
      }
      setSessions(data || [])
      
      // Auto-select most recent session or create new one
      if (data && data.length > 0) {
        selectSession(data[0])
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setSessions([])
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const selectSession = async (session: ChatSession) => {
    setCurrentSession(session)
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewSession = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ title: 'New Chat' })
        .select()
        .single()

      if (error) throw error
      
      setSessions(prev => [data, ...prev])
      setCurrentSession(data)
      setMessages([])
    } catch (err) {
      console.error('Error creating session:', err)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await supabase.from('chat_sessions').delete().eq('id', sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Error deleting session:', err)
    }
  }

  const updateSessionTitle = async (sessionId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '')
    try {
      await supabase
        .from('chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title } : s
      ))
    } catch (err) {
      console.error('Error updating title:', err)
    }
  }

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: Attachment[] = []
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file)
      newAttachments.push({
        name: file.name,
        type: file.type,
        url,
        file
      })
    })
    setAttachments(prev => [...prev, ...newAttachments])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev]
      URL.revokeObjectURL(newAttachments[index].url)
      newAttachments.splice(index, 1)
      return newAttachments
    })
  }

  const sendMessage = async (messageText?: string) => {
    const text = messageText || inputValue
    if ((text.trim() === "" && attachments.length === 0) || isLoading) return

    // Create session if none exists
    let sessionId: string
    if (!currentSession) {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ title: text.slice(0, 40) || 'Image Analysis' })
        .select()
        .single()
      
      if (error || !data) {
        console.error('Error creating session:', error)
        return
      }
      sessionId = data.id
      setCurrentSession(data)
      setSessions(prev => [data, ...prev])
    } else {
      sessionId = currentSession.id
    }

    // Build message content with attachments info
    let messageContent = text
    if (attachments.length > 0) {
      const attachmentNames = attachments.map(a => a.name).join(', ')
      messageContent = text ? `${text}\n\n[Attached: ${attachmentNames}]` : `[Attached: ${attachmentNames}]`
    }

    // Save user message
    const { data: userMsg, error: userError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: messageContent
      })
      .select()
      .single()

    if (userError) {
      console.error('Error saving message:', userError)
      return
    }

    setMessages(prev => [...prev, userMsg])
    setInputValue("")
    const currentAttachments = [...attachments]
    setAttachments([])
    setIsLoading(true)

    // Update title if first message
    if (messages.length === 0) {
      updateSessionTitle(sessionId, text || 'Image Analysis')
    }

    try {
      // Build history for context (last 20 messages)
      const history = messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content
      }))

      // Convert images to base64 for vision models
      const imageContents: { type: string; image_url?: { url: string }; text?: string }[] = []
      
      for (const attachment of currentAttachments) {
        if (attachment.type.startsWith('image/') && attachment.file) {
          const base64 = await fileToBase64(attachment.file)
          imageContents.push({
            type: 'image_url',
            image_url: { url: base64 }
          })
        }
      }

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          history,
          model: selectedModel,
          thinkingMode,
          selectedTool,
          images: imageContents.length > 0 ? imageContents : undefined
        })
      })

      const data = await response.json()
      const assistantContent = data.message || data.error || "Sorry, I couldn't process that."

      // Update token usage
      if (data.usage) {
        setTokenUsage(prev => ({
          input: prev.input + (data.usage.prompt_tokens || 0),
          output: prev.output + (data.usage.completion_tokens || 0)
        }))
      }

      // Parse task suggestions (don't auto-create)
      const suggestions = parseTaskSuggestions(assistantContent)
      if (suggestions.length > 0) {
        setTaskSuggestions(prev => [...prev, ...suggestions])
      }
      
      // Clean the content for display (remove task tags)
      const displayContent = cleanTaskTags(assistantContent)

      // Save assistant message (with cleaned content)
      const { data: assistantMsg, error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: displayContent
        })
        .select()
        .single()

      if (!assistantError && assistantMsg) {
        setMessages(prev => [...prev, assistantMsg])
      }

      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)

    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Parse tasks from Milo's response - show as suggestions instead of auto-creating
  const parseTaskSuggestions = (content: string): TaskSuggestion[] => {
    const taskRegex = /\[TASK:\s*title="([^"]+)"(?:\s*priority="(high|medium|low)")?(?:\s*due="(\d{4}-\d{2}-\d{2})")?(?:\s*habit="(true|false)")?(?:\s*frequency="(daily|weekly|weekdays)")?\]/g
    const matches = Array.from(content.matchAll(taskRegex))
    
    return matches.map((match, index) => {
      const [_, title, priority = 'medium', dueDate, isHabit, frequency] = match
      return {
        id: `task-${Date.now()}-${index}`,
        title,
        priority,
        dueDate: dueDate || undefined,
        isHabit: isHabit === 'true',
        frequency: frequency || undefined,
        status: 'pending' as const
      }
    })
  }

  // Accept a task suggestion
  const acceptTask = async (suggestion: TaskSuggestion) => {
    const titleToUse = suggestion.editedTitle || suggestion.title
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: titleToUse,
          priority: suggestion.priority,
          due_date: suggestion.dueDate || null,
          completed: false,
          is_habit: suggestion.isHabit,
          frequency: suggestion.isHabit ? (suggestion.frequency || 'daily') : null,
          streak: 0,
          best_streak: 0
        })
      
      if (!error) {
        setTaskSuggestions(prev => prev.map(t => 
          t.id === suggestion.id ? { ...t, status: 'accepted' as const } : t
        ))
      }
    } catch (err) {
      console.error('Error creating task:', err)
    }
  }

  // Reject a task suggestion
  const rejectTask = (id: string) => {
    setTaskSuggestions(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'rejected' as const } : t
    ))
  }

  // Start editing a task
  const startEditingTask = (id: string) => {
    setTaskSuggestions(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'editing' as const, editedTitle: t.title } : t
    ))
  }

  // Update edited title
  const updateEditedTitle = (id: string, title: string) => {
    setTaskSuggestions(prev => prev.map(t => 
      t.id === id ? { ...t, editedTitle: title } : t
    ))
  }

  // Remove task tags from displayed content
  const cleanTaskTags = (content: string) => {
    return content.replace(/\[TASK:[^\]]+\]/g, '').trim()
  }

  // Edit a specific message (like Windsurf)
  const startEditingMessage = (message: Message) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }

  // Save edited message and regenerate response
  const saveEditedMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    // Update the message in database
    await supabase
      .from('chat_messages')
      .update({ content: editingContent })
      .eq('id', messageId)

    // Delete all messages after this one
    const messagesToDelete = messages.slice(messageIndex + 1).map(m => m.id)
    if (messagesToDelete.length > 0) {
      await supabase
        .from('chat_messages')
        .delete()
        .in('id', messagesToDelete)
    }

    // Update local state
    setMessages(prev => prev.slice(0, messageIndex + 1).map(m => 
      m.id === messageId ? { ...m, content: editingContent } : m
    ))
    setEditingMessageId(null)
    setEditingContent('')

    // Regenerate response with edited message
    sendMessage(editingContent)
  }

  // Delete a message and all after it
  const deleteMessageAndAfter = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    const messagesToDelete = messages.slice(messageIndex).map(m => m.id)
    await supabase
      .from('chat_messages')
      .delete()
      .in('id', messagesToDelete)

    setMessages(prev => prev.slice(0, messageIndex))
  }

  const formatContent = (content: string) => {
    const lines = content.split('\n')
    const elements: JSX.Element[] = []
    let inCodeBlock = false
    let codeContent: string[] = []
    let codeLanguage = ''
    let inList = false
    let listItems: JSX.Element[] = []
    let listType: 'ul' | 'ol' = 'ul'

    const flushList = (key: number) => {
      if (listItems.length > 0) {
        if (listType === 'ol') {
          elements.push(
            <ol key={`list-${key}`} className="my-2 ml-4 space-y-1 list-decimal list-inside text-sm">
              {listItems}
            </ol>
          )
        } else {
          elements.push(
            <ul key={`list-${key}`} className="my-2 ml-4 space-y-1">
              {listItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                  <span>{item.props.children}</span>
                </li>
              ))}
            </ul>
          )
        }
        listItems = []
        inList = false
      }
    }

    lines.forEach((line, i) => {
      // Code block handling
      if (line.startsWith('```')) {
        flushList(i)
        if (!inCodeBlock) {
          inCodeBlock = true
          codeLanguage = line.slice(3).trim()
          codeContent = []
        } else {
          const code = codeContent.join('\n')
          const isPreviewable = ['html', 'htm', 'jsx', 'tsx', 'css', 'javascript', 'js'].includes(codeLanguage.toLowerCase())
          
          elements.push(
            <div key={i} className="my-3 rounded-xl overflow-hidden border bg-zinc-950 dark:bg-zinc-900">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                <span className="text-xs text-zinc-400 font-mono">{codeLanguage || 'code'}</span>
                <div className="flex items-center gap-2">
                  {isPreviewable && (
                    <button 
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      onClick={() => setCodePreview({ code, language: codeLanguage, isOpen: true })}
                    >
                      <Play className="h-3 w-3" />
                      Preview
                    </button>
                  )}
                  <button 
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                    onClick={() => navigator.clipboard.writeText(code)}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                </div>
              </div>
              <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-100 max-h-[300px]">
                <code>{code}</code>
              </pre>
            </div>
          )
          inCodeBlock = false
        }
        return
      }

      if (inCodeBlock) {
        codeContent.push(line)
        return
      }

      // Empty line
      if (line.trim() === '') {
        flushList(i)
        elements.push(<div key={i} className="h-2" />)
        return
      }

      // Images (markdown format)
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/)
      if (imageMatch) {
        flushList(i)
        elements.push(
          <div key={i} className="my-3">
            <img 
              src={imageMatch[2]} 
              alt={imageMatch[1]} 
              className="max-w-full rounded-xl border shadow-sm"
              loading="lazy"
            />
          </div>
        )
        return
      }

      // Headers
      if (line.startsWith('### ')) {
        flushList(i)
        elements.push(
          <h4 key={i} className="font-semibold text-sm mt-3 mb-1 text-purple-500">{formatInlineText(line.slice(4))}</h4>
        )
        return
      }
      if (line.startsWith('## ')) {
        flushList(i)
        elements.push(
          <h3 key={i} className="font-semibold mt-3 mb-1">{formatInlineText(line.slice(3))}</h3>
        )
        return
      }
      if (line.startsWith('# ')) {
        flushList(i)
        elements.push(
          <h2 key={i} className="font-bold text-lg mt-3 mb-1">{formatInlineText(line.slice(2))}</h2>
        )
        return
      }

      // Numbered list
      const numberedMatch = line.match(/^(\d+)\.\s(.+)/)
      if (numberedMatch) {
        if (!inList || listType !== 'ol') {
          flushList(i)
          inList = true
          listType = 'ol'
        }
        listItems.push(<span key={`item-${i}`}>{formatInlineText(numberedMatch[2])}</span>)
        return
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
        if (!inList || listType !== 'ul') {
          flushList(i)
          inList = true
          listType = 'ul'
        }
        const text = line.replace(/^[-•*]\s/, '')
        listItems.push(<span key={`item-${i}`}>{formatInlineText(text)}</span>)
        return
      }

      // Not a list item, flush any pending list
      flushList(i)

      // Regular paragraph with inline formatting
      elements.push(<p key={i} className="text-sm leading-relaxed">{formatInlineText(line)}</p>)
    })

    // Flush any remaining list
    flushList(lines.length)

    return elements
  }

  // Format inline text (bold, italic, code)
  const formatInlineText = (text: string) => {
    const parts: (string | JSX.Element)[] = []
    let remaining = text
    let keyIndex = 0

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      // Inline code `text`
      const codeMatch = remaining.match(/`([^`]+)`/)
      // Italic *text*
      const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/)

      const matches = [
        boldMatch ? { match: boldMatch, type: 'bold', index: boldMatch.index! } : null,
        codeMatch ? { match: codeMatch, type: 'code', index: codeMatch.index! } : null,
        italicMatch ? { match: italicMatch, type: 'italic', index: italicMatch.index! } : null,
      ].filter(Boolean).sort((a, b) => a!.index - b!.index)

      if (matches.length === 0) {
        parts.push(remaining)
        break
      }

      const first = matches[0]!
      if (first.index > 0) {
        parts.push(remaining.slice(0, first.index))
      }

      if (first.type === 'bold') {
        parts.push(<strong key={keyIndex++}>{first.match[1]}</strong>)
      } else if (first.type === 'code') {
        parts.push(<code key={keyIndex++} className="bg-black/10 dark:bg-white/10 px-1 rounded text-xs">{first.match[1]}</code>)
      } else if (first.type === 'italic') {
        parts.push(<em key={keyIndex++}>{first.match[1]}</em>)
      }

      remaining = remaining.slice(first.index + first.match[0].length)
    }

    return parts
  }

  // Group sessions by time period
  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const groups: { label: string; sessions: ChatSession[] }[] = [
      { label: 'Today', sessions: [] },
      { label: 'Yesterday', sessions: [] },
      { label: 'This Week', sessions: [] },
      { label: 'This Month', sessions: [] },
      { label: 'Older', sessions: [] },
    ]

    sessions.forEach(session => {
      const date = new Date(session.updated_at)
      if (date >= today) {
        groups[0].sessions.push(session)
      } else if (date >= yesterday) {
        groups[1].sessions.push(session)
      } else if (date >= lastWeek) {
        groups[2].sessions.push(session)
      } else if (date >= lastMonth) {
        groups[3].sessions.push(session)
      } else {
        groups[4].sessions.push(session)
      }
    })

    return groups.filter(g => g.sessions.length > 0)
  }

  const groupedSessions = groupSessionsByDate(sessions)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* CTRoom Navigation Sidebar - LEFT side (all screen sizes) */}
      <div className={`
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-50 w-56 transform transition-transform duration-300 ease-out ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}` 
          : 'w-14 hover:w-56 transition-all duration-300 group/sidebar'
        } bg-background border-r flex-shrink-0
      `}>
        <div className={`${isMobile ? 'w-56' : 'w-14 group-hover/sidebar:w-56'} h-full flex flex-col transition-all duration-300`}>
          {/* Sidebar Header */}
          <div className="p-3 border-b flex items-center justify-between shrink-0 h-14">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <span className={`font-semibold text-sm whitespace-nowrap ${isMobile ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'} transition-opacity duration-300`}>CTRoom</span>
            </div>
            {isMobile && (
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setShowMobileMenu(false)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 p-2 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = item.id === 'chat'
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (item.id === 'overview') {
                          router.push('/ctroom')
                        } else {
                          router.push(`/ctroom?section=${item.id}`)
                        }
                        if (isMobile) setShowMobileMenu(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className={`text-sm whitespace-nowrap ${isMobile ? 'opacity-100' : 'opacity-0 group-hover/sidebar:opacity-100'} transition-opacity duration-300`}>{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  {!isMobile && (
                    <TooltipContent side="right" className="group-hover/sidebar:hidden">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Chat History Sidebar Overlay - RIGHT side */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Sticky Header */}
        <div className="h-12 md:h-14 border-b flex items-center px-3 md:px-4 shrink-0 gap-2 bg-background sticky top-0 z-20">
          {/* Left side - Menu toggle on mobile */}
          <div className="flex items-center gap-1">
            {/* Mobile menu button */}
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 shrink-0 md:hidden"
              onClick={() => setShowMobileMenu(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Model selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 font-medium">
                <span className="text-base">{currentModel.icon}</span>
                <span className="text-sm hidden sm:inline">{currentModel.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {MODELS.map(model => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`cursor-pointer p-3 ${selectedModel === model.id ? 'bg-primary/10' : ''}`}
                >
                  <div className="flex gap-3 w-full">
                    <span className="text-xl">{model.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{model.name}</span>
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{model.provider}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Context: {model.contextWindow} tokens</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {currentSession && (
              <span className="text-xs text-muted-foreground hidden md:inline mr-2">
                {messages.length} messages
              </span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={createNewSession}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
            
            {/* Chat history toggle - RIGHT side */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 shrink-0"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  {showSidebar ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showSidebar ? 'Hide History' : 'Show History'}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full relative overflow-hidden" ref={scrollAreaRef}>
            {/* Simple gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-chat via-chat to-muted/30 dark:to-muted/10" />
            
            {/* Content container */}
            <div className="relative z-10 max-w-3xl mx-auto px-3 md:px-4 py-4 md:py-6">
              {messages.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] text-center px-2">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-purple-500/20">
                    <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-white" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold mb-2">What's good, King! 👑</h2>
                  <p className="text-sm md:text-base text-muted-foreground mb-1">
                    I'm <span className="font-semibold text-purple-500">Milo</span>, your strategic advisor.
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mb-6 md:mb-8 max-w-md">
                    I remember our past conversations and can help you with planning, content, goals, and more.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 w-full max-w-lg">
                    {QUICK_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(prompt.text)}
                        className="group flex flex-col items-start gap-1 p-2 md:p-3 rounded-xl border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left"
                      >
                        <span className="text-lg md:text-xl">{prompt.icon}</span>
                        <span className="text-[10px] md:text-xs font-medium leading-tight">{prompt.text}</span>
                        <span className="text-[9px] md:text-[10px] text-muted-foreground">{prompt.category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map(message => (
                    <div key={message.id} className={`group flex gap-2 md:gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                      {/* Avatar */}
                      {message.role === "user" ? (
                        <div className="h-7 w-7 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 text-white font-bold text-xs md:text-sm shadow-sm">
                          K
                        </div>
                      ) : (
                        <div className="h-7 w-7 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
                          <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-white" />
                        </div>
                      )}
                      
                      {/* Message Content */}
                      <div className={`flex-1 max-w-[88%] md:max-w-[85%] ${message.role === "user" ? "text-right" : ""}`}>
                        {editingMessageId === message.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full p-3 rounded-xl border bg-background text-sm resize-none"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => setEditingMessageId(null)}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => saveEditedMessage(message.id)}>
                                Save & Regenerate
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div 
                              className={`relative inline-block rounded-2xl px-4 py-3 ${
                                message.role === "user" 
                                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                                  : "bg-muted rounded-tl-sm"
                              }`}
                            >
                              <div className="text-sm space-y-1 text-left">{formatContent(message.content)}</div>
                              
                              {/* Edit/Delete buttons - inside bubble, show on hover */}
                              {message.role === "user" && (
                                <div className="absolute -bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 bg-background/90 backdrop-blur rounded-lg border shadow-sm px-1 py-0.5">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button 
                                        onClick={() => startEditingMessage(message)}
                                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit & regenerate</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button 
                                        onClick={() => deleteMessageAndAfter(message.id)}
                                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete from here</TooltipContent>
                                  </Tooltip>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 px-1">
                              {formatTime(message.created_at)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Enhanced thinking indicator with steps */}
                  {isLoading && (
                    <div className="flex gap-2 md:gap-3">
                      <div className="h-7 w-7 md:h-9 md:w-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
                        <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-white animate-pulse" />
                      </div>
                      <div className="flex-1 max-w-[88%] md:max-w-[85%]">
                        <div className="bg-muted rounded-2xl rounded-tl-sm overflow-hidden">
                          <button 
                            onClick={() => setShowThinking(!showThinking)}
                            className="w-full px-3 md:px-4 py-2 flex items-center gap-2 hover:bg-muted/80 transition-colors"
                          >
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-[10px] md:text-xs text-muted-foreground">
                              {selectedTool === 'web' ? 'Searching the web...' : 
                               selectedTool === 'code' ? 'Writing code...' :
                               'Milo is thinking...'}
                            </span>
                            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ml-auto ${showThinking ? '' : '-rotate-90'}`} />
                          </button>
                          {showThinking && (
                            <div className="px-3 md:px-4 pb-3 text-[10px] md:text-xs text-muted-foreground border-t pt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-purple-500/20 flex items-center justify-center">
                                  <Brain className="h-2.5 w-2.5 text-purple-500" />
                                </div>
                                <span>Using {currentModel.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center">
                                  <currentThinkingMode.icon className="h-2.5 w-2.5 text-blue-500" />
                                </div>
                                <span>{currentThinkingMode.name} mode</span>
                              </div>
                              {selectedTool && (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded bg-green-500/20 flex items-center justify-center">
                                    <Wrench className="h-2.5 w-2.5 text-green-500" />
                                  </div>
                                  <span>Tool: {AI_TOOLS.find(t => t.id === selectedTool)?.name}</span>
                                </div>
                              )}
                              {thinkingSteps.length > 0 && (
                                <div className="mt-2 pt-2 border-t space-y-1">
                                  {thinkingSteps.slice(-3).map(step => (
                                    <div key={step.id} className="flex items-start gap-2 text-[10px]">
                                      <span className="text-purple-500">→</span>
                                      <span className="opacity-70">{step.content}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Task Suggestions Panel */}
                  {taskSuggestions.filter(t => t.status === 'pending' || t.status === 'editing').length > 0 && (
                    <div className="mt-4 p-4 rounded-xl border-2 border-purple-500/20 bg-purple-500/5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-medium text-sm">Milo suggested some tasks</span>
                      </div>
                      <div className="space-y-2">
                        {taskSuggestions.filter(t => t.status === 'pending' || t.status === 'editing').map(suggestion => (
                          <div key={suggestion.id} className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                            {suggestion.status === 'editing' ? (
                              <input
                                type="text"
                                value={suggestion.editedTitle}
                                onChange={(e) => updateEditedTitle(suggestion.id, e.target.value)}
                                className="flex-1 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
                                autoFocus
                              />
                            ) : (
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{suggestion.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    suggestion.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                                    suggestion.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                    'bg-green-500/10 text-green-500'
                                  }`}>{suggestion.priority}</span>
                                  {suggestion.dueDate && <span className="text-[10px] text-muted-foreground">{suggestion.dueDate}</span>}
                                  {suggestion.isHabit && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500">habit</span>}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              {suggestion.status === 'editing' ? (
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => acceptTask(suggestion)}>
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                </Button>
                              ) : (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditingTask(suggestion.id)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => acceptTask(suggestion)}>
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Accept</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => rejectTask(suggestion.id)}>
                                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Dismiss</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
          <div className="max-w-3xl mx-auto px-3 md:px-4 pt-2">
            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative group">
                    {attachment.type.startsWith('image/') ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-primary/20">
                        <img src={attachment.url} alt={attachment.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs truncate max-w-[100px]">{attachment.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Container - Like Gemini */}
            <div className="rounded-2xl border bg-muted/30 overflow-hidden shadow-sm">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.md"
                multiple
                className="hidden"
              />
              
              {/* Text input */}
              <div className="px-3 md:px-4 py-2 md:py-3">
                <textarea
                  placeholder="Message Milo..."
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  className="w-full min-h-[24px] max-h-[120px] md:max-h-[150px] text-sm bg-transparent border-0 focus:outline-none focus:ring-0 resize-none placeholder:text-muted-foreground"
                  disabled={isLoading}
                  rows={1}
                />
              </div>

              {/* Bottom toolbar - Like Gemini */}
              <div className="flex items-center justify-between px-2 py-1.5 md:py-2 border-t bg-background/50">
                <div className="flex items-center gap-0.5 md:gap-1">
                  {/* Attach button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 md:h-8 md:w-8 rounded-lg"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach</TooltipContent>
                  </Tooltip>

                  {/* Tools dropdown - Like Gemini */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 md:gap-1.5 h-7 md:h-8 px-2 md:px-3 rounded-lg hover:bg-muted transition-colors text-sm">
                        <Wrench className="h-3.5 w-3.5" />
                        <span className="text-xs hidden sm:inline">Tools</span>
                        {selectedTool && (
                          <span className="text-[10px] px-1 md:px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 truncate max-w-[60px] md:max-w-none">
                            {AI_TOOLS.find(t => t.id === selectedTool)?.name}
                          </span>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem 
                        onClick={() => setSelectedTool(null)}
                        className={`cursor-pointer ${!selectedTool ? 'bg-primary/10' : ''}`}
                      >
                        <span className="text-sm">None</span>
                      </DropdownMenuItem>
                      {availableTools.map(tool => {
                        const Icon = tool.icon
                        return (
                          <DropdownMenuItem
                            key={tool.id}
                            onClick={() => setSelectedTool(tool.id)}
                            className={`cursor-pointer ${selectedTool === tool.id ? 'bg-primary/10' : ''}`}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            <span className="text-sm">{tool.name}</span>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-0.5 md:gap-1">
                  {/* Thinking mode dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 md:gap-1.5 h-7 md:h-8 px-2 md:px-3 rounded-lg hover:bg-muted transition-colors text-sm">
                        <currentThinkingMode.icon className="h-3.5 w-3.5" />
                        <span className="text-xs hidden sm:inline">{currentThinkingMode.name}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {THINKING_MODES.map(mode => {
                        const Icon = mode.icon
                        return (
                          <DropdownMenuItem
                            key={mode.id}
                            onClick={() => setThinkingMode(mode.id)}
                            className={`cursor-pointer ${thinkingMode === mode.id ? 'bg-primary/10' : ''}`}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            <span className="text-sm">{mode.name}</span>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Send button */}
                  <Button 
                    size="icon"
                    className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    onClick={() => sendMessage()}
                    disabled={isLoading || (!inputValue.trim() && attachments.length === 0)}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Token usage */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 px-1 pb-2">
              <span className="hidden sm:inline">Enter to send • Shift+Enter for new line</span>
              <span className="sm:hidden">Tap send</span>
              <span>
                {tokenUsage.input > 0 
                  ? `~${Math.round((tokenUsage.input + tokenUsage.output) / 1000)}k tokens` 
                  : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat History Sidebar - RIGHT side */}
      <div className={`
        ${isMobile 
          ? `fixed inset-y-0 right-0 z-50 w-72 transform transition-transform duration-300 ease-out ${showSidebar ? 'translate-x-0' : 'translate-x-full'}` 
          : `${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden`
        } bg-background border-l flex-shrink-0
      `}>
        <div className="w-72 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-3 border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">Chat History</h2>
                <p className="text-[10px] text-muted-foreground">{sessions.length} conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={createNewSession}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Chat</TooltipContent>
              </Tooltip>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 md:hidden"
                onClick={() => setShowSidebar(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border bg-muted/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Sessions List */}
          <ScrollArea className="flex-1 px-2">
            {isLoadingSessions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">No conversations yet</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={createNewSession}>
                  <Plus className="h-3 w-3 mr-1" />
                  Start chatting
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {groupedSessions.map(group => (
                  <div key={group.label}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">{group.label}</p>
                    <div className="space-y-1">
                      {group.sessions.map(session => (
                        <div
                          key={session.id}
                          className={`group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                            currentSession?.id === session.id 
                              ? 'bg-primary/10 border border-primary/20' 
                              : 'hover:bg-muted border border-transparent'
                          }`}
                          onClick={() => {
                            selectSession(session)
                            if (isMobile) setShowSidebar(false)
                          }}
                        >
                          <MessageSquare className={`h-4 w-4 shrink-0 ${currentSession?.id === session.id ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session.title}</p>
                            <p className="text-[10px] text-muted-foreground">{formatTime(session.updated_at)}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Token Usage Footer */}
          <div className="p-3 border-t shrink-0">
            <div className="text-[10px] text-muted-foreground space-y-1.5">
              <div className="flex justify-between">
                <span>Session tokens</span>
                <span className="font-medium">{tokenUsage.input + tokenUsage.output > 0 ? `~${Math.round((tokenUsage.input + tokenUsage.output) / 1000)}k` : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Input / Output</span>
                <span className="font-medium">{tokenUsage.input} / {tokenUsage.output}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Preview Modal - Like Gemini Canvas */}
      {codePreview.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Code className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Code Preview</h3>
                  <p className="text-[10px] text-muted-foreground">{codePreview.language || 'HTML/JS'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Tab buttons */}
                <div className="flex bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setPreviewTab('code')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      previewTab === 'code' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                  >
                    <Code className="h-3 w-3 inline mr-1" />
                    Code
                  </button>
                  <button
                    onClick={() => setPreviewTab('preview')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      previewTab === 'preview' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                    }`}
                  >
                    <Eye className="h-3 w-3 inline mr-1" />
                    Preview
                  </button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(codePreview.code)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setCodePreview({ ...codePreview, isOpen: false })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden min-h-[400px]">
              {previewTab === 'code' ? (
                <ScrollArea className="h-full">
                  <pre className="p-4 text-sm font-mono text-zinc-100 bg-zinc-950">
                    <code>{codePreview.code}</code>
                  </pre>
                </ScrollArea>
              ) : (
                <div className="h-full bg-white relative">
                  <iframe
                    ref={iframeRef}
                    srcDoc={(() => {
                      const lang = codePreview.language.toLowerCase()
                      const code = codePreview.code
                      
                      // Check if it's React/JSX code
                      const isReact = lang === 'jsx' || lang === 'tsx' || 
                        code.includes('import React') || code.includes('from "react"') ||
                        code.includes("from 'react'") || code.includes('useState') ||
                        code.includes('useEffect') || code.includes('<App')
                      
                      // Check if it's Python (show message)
                      const isPython = lang === 'python' || lang === 'py'
                      
                      if (isPython) {
                        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui; padding: 40px; background: #1e1e1e; color: #fff; }
    .container { max-width: 600px; margin: 0 auto; text-align: center; }
    h2 { color: #4fc3f7; margin-bottom: 20px; }
    p { color: #aaa; line-height: 1.6; }
    code { background: #333; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🐍 Python Code</h2>
    <p>Python code cannot be executed in the browser. Copy the code and run it locally with <code>python filename.py</code></p>
  </div>
</body>
</html>`
                      }
                      
                      if (isReact) {
                        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useCallback, useMemo } = React;
    
    ${code.replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '')
          .replace(/export\s+default\s+/g, '')
          .replace(/export\s+/g, '')}
    
    // Try to find and render the main component
    const components = [typeof App !== 'undefined' ? App : null, typeof Main !== 'undefined' ? Main : null].filter(Boolean);
    if (components.length > 0) {
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(components[0]));
    }
  </script>
</body>
</html>`
                      }
                      
                      // HTML code
                      if (lang === 'html' || lang === 'htm') {
                        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`
                      }
                      
                      // CSS code
                      if (lang === 'css') {
                        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${code}</style>
</head>
<body>
  <div style="padding:20px;">
    <h1>CSS Preview</h1>
    <p>Your styles are applied to this page.</p>
    <button class="btn">Sample Button</button>
    <div class="box">Sample Box</div>
  </div>
</body>
</html>`
                      }
                      
                      // JavaScript code
                      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; padding: 20px; }
    #output { background: #1e1e1e; color: #4fc3f7; padding: 16px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; margin-top: 16px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="output"></div>
  <script>
    // Capture console.log output
    const output = document.getElementById('output');
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      output.textContent += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ') + '\\n';
    };
    
    try {
      ${code}
    } catch (error) {
      output.textContent = 'Error: ' + error.message;
      output.style.color = '#f44336';
    }
  </script>
</body>
</html>`
                    })()}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
                    title="Code Preview"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
