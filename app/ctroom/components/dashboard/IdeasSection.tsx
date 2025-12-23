"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { 
  Lightbulb, Plus, Trash2, Pin, PinOff, Search, 
  Clock, Sparkles, StickyNote, RefreshCw, Edit3, X,
  MessageSquare, Save, ArrowLeft, Paperclip, Image as ImageIcon,
  Send, Bot, User, Loader2, Check, Copy, Maximize2, Minimize2,
  PanelRightOpen, PanelRightClose, ChevronLeft
} from "lucide-react"

interface Idea {
  id: string
  title: string
  content: string
  category: string
  pinned: boolean
  created_at: string
  updated_at: string
}

interface IdeasSectionProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

interface AIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

interface ChatHistory {
  ideaId: string
  ideaTitle: string
  messages: AIMessage[]
}

const CATEGORIES = [
  { id: 'all', label: 'All', color: 'bg-gray-500', icon: '📋' },
  { id: 'feature', label: 'Feature', color: 'bg-blue-500', icon: '🚀' },
  { id: 'content', label: 'Content', color: 'bg-green-500', icon: '📝' },
  { id: 'business', label: 'Business', color: 'bg-purple-500', icon: '💼' },
  { id: 'personal', label: 'Personal', color: 'bg-pink-500', icon: '💭' },
  { id: 'random', label: 'Random', color: 'bg-orange-500', icon: '✨' },
]

export function IdeasSection({ addToast }: IdeasSectionProps) {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewIdea, setShowNewIdea] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('random')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  
  // Editing state
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Full-page expand view
  const [expandedIdea, setExpandedIdea] = useState<Idea | null>(null)
  const [expandedTitle, setExpandedTitle] = useState('')
  const [expandedContent, setExpandedContent] = useState('')
  const [expandedCategory, setExpandedCategory] = useState('')
  const [isExpandedSaving, setIsExpandedSaving] = useState(false)

  // AI Chat state - enhanced with docking and history
  const [showAIChat, setShowAIChat] = useState(false)
  const [aiChatIdea, setAiChatIdea] = useState<Idea | null>(null)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiChatDocked, setAiChatDocked] = useState(false)
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([])
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Fetch ideas from Supabase
  const fetchIdeas = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setIdeas(data || [])
    } catch (err) {
      console.error('Error fetching ideas:', err)
      setIdeas([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIdeas()
  }, [])

  // Create new idea
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      addToast({ type: 'error', title: 'Title required' })
      return
    }

    try {
      const { data, error } = await supabase
        .from('ideas')
        .insert([{
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
          pinned: false
        }])
        .select()
        .single()

      if (error) throw error

      setIdeas(prev => [data, ...prev])
      setNewTitle('')
      setNewContent('')
      setNewCategory('random')
      setShowNewIdea(false)
      addToast({ type: 'success', title: 'Idea saved!' })
    } catch (err) {
      console.error('Error creating idea:', err)
      addToast({ type: 'error', title: 'Failed to save idea' })
    }
  }

  // Toggle pin
  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .update({ pinned: !currentPinned })
        .eq('id', id)

      if (error) throw error

      setIdeas(prev => prev.map(idea => 
        idea.id === id ? { ...idea, pinned: !currentPinned } : idea
      ).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }))
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to update' })
    }
  }

  // Delete idea
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id)

      if (error) throw error

      setIdeas(prev => prev.filter(idea => idea.id !== id))
      if (editingIdea?.id === id) setEditingIdea(null)
      addToast({ type: 'success', title: 'Idea deleted' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to delete' })
    }
  }

  // Open idea for editing
  const openEditModal = (idea: Idea) => {
    setEditingIdea(idea)
    setEditTitle(idea.title)
    setEditContent(idea.content)
    setEditCategory(idea.category)
  }

  // Save edited idea
  const handleSaveEdit = async () => {
    if (!editingIdea || !editTitle.trim()) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('ideas')
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          category: editCategory,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingIdea.id)

      if (error) throw error

      setIdeas(prev => prev.map(idea => 
        idea.id === editingIdea.id 
          ? { ...idea, title: editTitle.trim(), content: editContent.trim(), category: editCategory, updated_at: new Date().toISOString() }
          : idea
      ))
      setEditingIdea(null)
      addToast({ type: 'success', title: 'Idea updated!' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to update' })
    } finally {
      setIsSaving(false)
    }
  }

  // Open full-page expanded view for an idea
  const openExpandedView = (idea: Idea) => {
    setExpandedIdea(idea)
    setExpandedTitle(idea.title)
    setExpandedContent(idea.content)
    setExpandedCategory(idea.category)
  }

  // Save expanded idea
  const saveExpandedIdea = async () => {
    if (!expandedIdea || !expandedTitle.trim()) return
    setIsExpandedSaving(true)

    try {
      const { error } = await supabase
        .from('ideas')
        .update({
          title: expandedTitle.trim(),
          content: expandedContent.trim(),
          category: expandedCategory,
          updated_at: new Date().toISOString()
        })
        .eq('id', expandedIdea.id)

      if (error) throw error

      setIdeas(prev => prev.map(idea => 
        idea.id === expandedIdea.id 
          ? { ...idea, title: expandedTitle.trim(), content: expandedContent.trim(), category: expandedCategory, updated_at: new Date().toISOString() }
          : idea
      ))
      // Update the expanded idea state too
      setExpandedIdea(prev => prev ? { ...prev, title: expandedTitle.trim(), content: expandedContent.trim(), category: expandedCategory, updated_at: new Date().toISOString() } : null)
      addToast({ type: 'success', title: 'Saved!' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to save' })
    } finally {
      setIsExpandedSaving(false)
    }
  }

  // Open inline AI chat for an idea - with history preservation
  const openAIChat = (idea: Idea) => {
    // Check if we have existing history for this idea
    const existingHistory = chatHistories.find(h => h.ideaId === idea.id)
    
    setAiChatIdea(idea)
    setShowAIChat(true)
    
    if (existingHistory && existingHistory.messages.length > 0) {
      // Restore previous conversation
      setAiMessages(existingHistory.messages)
    } else {
      // Start new conversation
      setAiMessages([{
        role: 'assistant',
        content: `Hi! I'm Milo. I see you want to discuss your note "${idea.title}". How can I help you with this idea? I can help you:\n\n• Expand on this concept\n• Brainstorm related ideas\n• Create an action plan\n• Refine the content\n\nWhat would you like to do?`,
        timestamp: new Date()
      }])
    }
  }

  // Close AI chat and save history
  const closeAIChat = () => {
    if (aiChatIdea && aiMessages.length > 1) {
      // Save chat history
      setChatHistories(prev => {
        const existing = prev.findIndex(h => h.ideaId === aiChatIdea.id)
        const newHistory: ChatHistory = {
          ideaId: aiChatIdea.id,
          ideaTitle: aiChatIdea.title,
          messages: aiMessages
        }
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = newHistory
          return updated
        }
        return [...prev, newHistory]
      })
    }
    setShowAIChat(false)
    setAiChatIdea(null)
  }

  // Send message to AI
  const sendAIMessage = async () => {
    if (!aiInput.trim() || !aiChatIdea) return
    
    const userMessage = aiInput.trim()
    setAiInput('')
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsAiLoading(true)

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: aiMessages.map(m => ({ role: m.role, content: m.content })),
          model: 'gpt-4o-mini',
          systemPrompt: `You are Milo, a helpful AI assistant. The user is working on an idea/note with the following details:

Title: ${aiChatIdea.title}
Category: ${aiChatIdea.category}
Content: ${aiChatIdea.content}

Help them develop, refine, or expand on this idea. Be concise but helpful. If they ask you to write content, provide it in a format they can easily copy and use.`
        })
      })

      const data = await response.json()
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.message || data.response || 'I apologize, I had trouble processing that. Could you try again?' }])
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setIsAiLoading(false)
    }
  }

  // Apply AI suggestion to the idea content
  const applyAISuggestion = async (suggestion: string) => {
    if (!aiChatIdea) return
    
    try {
      const newContent = aiChatIdea.content + '\n\n---\nAI Suggestion:\n' + suggestion
      
      const { error } = await supabase
        .from('ideas')
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq('id', aiChatIdea.id)

      if (error) throw error

      setIdeas(prev => prev.map(idea => 
        idea.id === aiChatIdea.id 
          ? { ...idea, content: newContent, updated_at: new Date().toISOString() }
          : idea
      ))
      setAiChatIdea(prev => prev ? { ...prev, content: newContent } : null)
      addToast({ type: 'success', title: 'Suggestion added to note!' })
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to apply suggestion' })
    }
  }

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast({ type: 'success', title: 'Copied to clipboard!' })
  }

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || idea.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.id === category)?.color || 'bg-gray-500'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            Ideas & Notes
          </h1>
          <p className="text-sm text-muted-foreground">Capture your thoughts and inspirations</p>
        </div>
        <Button onClick={() => setShowNewIdea(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Idea
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <Button
              key={cat.id}
              variant={filterCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(cat.id)}
              className="text-xs"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* New Idea Form - Enhanced */}
      {showNewIdea && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Capture Your Idea</span>
            </div>
            
            <input
              type="text"
              placeholder="Give your idea a title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full h-12 px-4 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-lg font-medium"
              autoFocus
            />
            
            <div className="relative">
              <textarea
                placeholder="Describe your idea in detail... What problem does it solve? What's the vision? Any initial thoughts?"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full min-h-[150px] px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm leading-relaxed"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {newContent.length} characters
              </div>
            </div>

            {/* Category Selection - Enhanced */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setNewCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2 ${
                      newCategory === cat.id 
                        ? `${cat.color} text-white shadow-md scale-105` 
                        : 'bg-muted hover:bg-muted/80 hover:scale-102'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Press Enter to save quickly
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowNewIdea(false); setNewTitle(''); setNewContent(''); setNewCategory('random'); }}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreate}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Save Idea
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredIdeas.length === 0 ? (
        <Card className="py-12">
          <div className="text-center text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No ideas yet</p>
            <p className="text-sm">Start capturing your thoughts!</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredIdeas.map(idea => (
            <Card 
              key={idea.id} 
              className={`group relative transition-all hover:shadow-md ${idea.pinned ? 'ring-2 ring-yellow-400/50' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {idea.pinned && <Pin className="h-3 w-3 text-yellow-500" />}
                    <Badge className={`${getCategoryColor(idea.category)} text-white text-[10px]`}>
                      {idea.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 text-blue-500 hover:text-blue-600"
                      onClick={() => openExpandedView(idea)}
                      title="Expand"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => openEditModal(idea)}
                      title="Edit"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 text-purple-500 hover:text-purple-600"
                      onClick={() => openAIChat(idea)}
                      title="Chat with Milo"
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => handleTogglePin(idea.id, idea.pinned)}
                      title={idea.pinned ? "Unpin" : "Pin"}
                    >
                      {idea.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(idea.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <h3 
                  className="font-medium text-sm mb-1 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => openExpandedView(idea)}
                >
                  {idea.title}
                </h3>
                {idea.content && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{idea.content}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  {idea.updated_at && idea.updated_at !== idea.created_at && (
                    <p className="text-[10px] text-muted-foreground">
                      edited
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingIdea} onOpenChange={(open) => !open && setEditingIdea(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Idea
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 space-y-4 overflow-y-auto">
            {/* Title */}
            <input
              type="text"
              placeholder="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full h-12 px-4 text-lg font-medium rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {/* Content - Apple Notes style */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                placeholder="Write your thoughts here..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[300px] px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm leading-relaxed"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              />
            </div>

            {/* Category selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setEditCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      editCategory === cat.id 
                        ? `${cat.color} text-white` 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meta info */}
            {editingIdea && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Created: {new Date(editingIdea.created_at).toLocaleString()}</p>
                {editingIdea.updated_at && editingIdea.updated_at !== editingIdea.created_at && (
                  <p>Last edited: {new Date(editingIdea.updated_at).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => editingIdea && openAIChat(editingIdea)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with Milo
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditingIdea(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving || !editTitle.trim()}>
                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-Page Expanded View */}
      {expandedIdea && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Header */}
          <div className="border-b p-4 flex items-center justify-between bg-background/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setExpandedIdea(null)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <Badge className={`${getCategoryColor(expandedCategory)} text-white text-xs`}>
                  {CATEGORIES.find(c => c.id === expandedCategory)?.icon} {expandedCategory}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openAIChat(expandedIdea)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with Milo
              </Button>
              <Button 
                size="sm" 
                onClick={saveExpandedIdea}
                disabled={isExpandedSaving}
              >
                {isExpandedSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setExpandedIdea(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full">
            {/* Title */}
            <input
              type="text"
              value={expandedTitle}
              onChange={(e) => setExpandedTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none mb-4"
            />

            {/* Category selector */}
            <div className="flex gap-2 mb-6">
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setExpandedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all flex items-center gap-1 ${
                    expandedCategory === cat.id 
                      ? `${cat.color} text-white` 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <textarea
              value={expandedContent}
              onChange={(e) => setExpandedContent(e.target.value)}
              placeholder="Start writing your thoughts here...

You can use this space to:
• Brainstorm ideas
• Write detailed notes
• Plan projects
• Document anything important"
              className="w-full min-h-[60vh] bg-transparent border-none focus:outline-none resize-none text-base leading-relaxed"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            />

            {/* Meta info */}
            <div className="text-xs text-muted-foreground mt-8 pt-4 border-t">
              <p>Created: {new Date(expandedIdea.created_at).toLocaleString()}</p>
              {expandedIdea.updated_at && expandedIdea.updated_at !== expandedIdea.created_at && (
                <p>Last edited: {new Date(expandedIdea.updated_at).toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* Docked AI Chat Panel */}
          {showAIChat && aiChatDocked && (
            <div className="w-96 border-l bg-background flex flex-col absolute right-0 top-0 bottom-0">
              <AIDockedChat />
            </div>
          )}
        </div>
      )}

      {/* AI Chat Dialog - Enhanced with docking */}
      <Dialog open={showAIChat && !aiChatDocked} onOpenChange={(open) => { if (!open) closeAIChat(); }}>
        <DialogContent className={`max-w-xl max-h-[80vh] flex flex-col p-0`}>
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Bot className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <span className="font-semibold">Chat with Milo</span>
                  {aiChatIdea && (
                    <p className="text-xs text-muted-foreground font-normal">
                      About: {aiChatIdea.title}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {chatHistories.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {chatHistories.length} saved chats
                  </Badge>
                )}
                {expandedIdea && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setAiChatDocked(true)}
                    title="Dock to side"
                  >
                    <PanelRightOpen className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </DialogTitle>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
            <div className="space-y-4">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === 'assistant' && i > 0 && (
                      <div className="flex gap-1 mt-2 pt-2 border-t border-border/50">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-xs"
                          onClick={() => copyToClipboard(msg.content)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-xs text-green-600 hover:text-green-700"
                          onClick={() => applyAISuggestion(msg.content)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Add to Note
                        </Button>
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isAiLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask Milo anything about this idea..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendAIMessage()}
                className="flex-1 h-10 px-4 rounded-full border bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                disabled={isAiLoading}
              />
              <Button 
                size="icon" 
                className="rounded-full h-10 w-10"
                onClick={sendAIMessage}
                disabled={isAiLoading || !aiInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7"
                onClick={() => setAiInput('Help me expand on this idea')}
              >
                Expand idea
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7"
                onClick={() => setAiInput('Create an action plan for this')}
              >
                Action plan
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7"
                onClick={() => setAiInput('What are potential challenges?')}
              >
                Challenges
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-7"
                onClick={() => setAiInput('Write a summary of this idea')}
              >
                Summarize
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  // Docked AI Chat component for expanded view
  function AIDockedChat() {
    return (
      <>
        {/* Header */}
        <div className="p-3 border-b bg-gradient-to-r from-purple-500/10 to-blue-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-sm">Milo</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setAiChatDocked(false)}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <Bot className="h-3 w-3 text-purple-600" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === 'assistant' && i > 0 && (
                    <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-border/50">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-[10px] px-2"
                        onClick={() => copyToClipboard(msg.content)}
                      >
                        <Copy className="h-2.5 w-2.5 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-[10px] px-2 text-green-600"
                        onClick={() => applyAISuggestion(msg.content)}
                      >
                        <Check className="h-2.5 w-2.5 mr-1" />
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-purple-600" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask Milo..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendAIMessage()}
              className="flex-1 h-8 px-3 rounded-full border bg-muted focus:outline-none focus:ring-2 focus:ring-primary text-xs"
              disabled={isAiLoading}
            />
            <Button 
              size="icon" 
              className="rounded-full h-8 w-8"
              onClick={sendAIMessage}
              disabled={isAiLoading || !aiInput.trim()}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </>
    )
  }
}
