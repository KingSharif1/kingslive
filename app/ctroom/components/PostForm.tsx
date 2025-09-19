"use client"

import { useState, useRef } from "react"
import { Save, X, Eye, EyeOff, ExternalLink, Palette, Move, Sparkles, Quote } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { BlogPost, Citation } from "../types"
import TagKeywordManager from "./TagKeywordManager"
import TiptapEditor from '@/app/components/TiptapEditor'

interface PostFormProps {
  post: Partial<BlogPost>
  setPost: (post: Partial<BlogPost>) => void
  tags: string[]
  setTags: (tags: string[]) => void
  keywords: string[]
  setKeywords: (keywords: string[]) => void
  newTag: string
  setNewTag: (tag: string) => void
  newKeyword: string
  setNewKeyword: (keyword: string) => void
  handleAddTag: () => void
  handleRemoveTag: (tag: string) => void
  handleAddKeyword: () => void
  handleRemoveKeyword: (keyword: string) => void
  handleSave: () => Promise<void>
  activeTab: string
  setActiveTab: (tab: string) => void
  onCancel?: () => void
}

export default function PostForm({
  post,
  setPost,
  tags,
  setTags,
  keywords,
  setKeywords,
  newTag,
  setNewTag,
  newKeyword,
  setNewKeyword,
  handleAddTag,
  handleRemoveTag,
  handleAddKeyword,
  handleRemoveKeyword,
  handleSave,
  activeTab,
  setActiveTab,
  onCancel
}: PostFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [citations, setCitations] = useState<Citation[]>(post.citations || [])
  const [newCitation, setNewCitation] = useState("")
  const [isLoadingCitation, setIsLoadingCitation] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState("default")
  const [showThemePanel, setShowThemePanel] = useState(false)
  
  // Citation form state
  const [citationForm, setCitationForm] = useState({
    author: '',
    title: '',
    description: '',
    publishedDate: '',
    url: ''
  })

  const handleSaveClick = async () => {
    setIsSaving(true)
    try {
      await handleSave()
      // Always reset saving state after operation completes
      setIsSaving(false)
    } catch (error) {
      console.error('Error saving post:', error)
      // Reset saving state on error
      setIsSaving(false)
    }
  }

  const updatePost = (field: keyof BlogPost, value: any) => {
    setPost({ ...post, [field]: value })
  }

  const extractMetadata = async (url: string): Promise<Partial<Citation>> => {
    try {
      setIsLoadingCitation(true)
      
      // Call our metadata extraction API
      const response = await fetch('/api/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      if (response.ok) {
        const metadata = await response.json()
        return {
          title: metadata.title || new URL(url).hostname,
          author: metadata.author || '',
          description: metadata.siteName || metadata.description || '',
          publishedDate: metadata.publishedTime || '',
          url: url
        }
      }
    } catch (error) {
      console.error('Error extracting metadata:', error)
    } finally {
      setIsLoadingCitation(false)
    }
    
    // Fallback to basic info
    try {
      const urlObj = new URL(url)
      return {
        title: urlObj.hostname,
        url: url,
        description: urlObj.hostname
      }
    } catch {
      return { title: url, url: '' }
    }
  }

  const addCitation = async () => {
    // Check if we have at least a title or URL
    if (!citationForm.title.trim() && !citationForm.url.trim()) return
    
    const citation: Citation = {
      id: Date.now().toString(),
      title: citationForm.title || 'Untitled',
      author: citationForm.author || undefined,
      description: citationForm.description || undefined,
      publishedDate: citationForm.publishedDate || undefined,
      url: citationForm.url || ''
    }
    
    const updatedCitations = [...citations, citation]
    setCitations(updatedCitations)
    updatePost("citations", updatedCitations)
    
    // Reset form
    setCitationForm({
      author: '',
      title: '',
      description: '',
      publishedDate: '',
      url: ''
    })
  }
  
  const handleUrlPaste = async (url: string) => {
    if (!url.startsWith('http')) return
    
    const metadata = await extractMetadata(url)
    setCitationForm(prev => ({
      ...prev,
      ...metadata,
      url: url
    }))
  }

  const removeCitation = (id: string) => {
    const updatedCitations = citations.filter(citation => citation.id !== id)
    setCitations(updatedCitations)
    updatePost("citations", updatedCitations)
  }


  const renderMarkdown = (content: string) => {
    return content
      // Headings with better spacing
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3 mt-6 leading-tight">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 mt-8 leading-tight">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-8 leading-tight">$1</h1>')
      
      // Text formatting with better styling
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-gray-800 dark:text-gray-200">$1</em>')
      
      // Custom highlight syntax
      .replace(/===([^=]+)===/g, '<span class="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-2 py-1 rounded font-medium">$1</span>')
      
      // Code blocks
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono text-teal-600 dark:text-teal-400">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-xl overflow-x-auto my-4 border border-gray-700"><code class="text-sm">$1</code></pre>')
      
      // Links and images
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-6 shadow-lg border border-gray-200 dark:border-gray-700" />')
      
      // Lists and quotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-teal-500 pl-6 py-3 my-4 bg-gray-50 dark:bg-gray-800 italic text-gray-700 dark:text-gray-300 rounded-r-lg">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300 list-decimal">$1</li>')
      
      // Line breaks
      .replace(/\n/g, '<br class="my-2">')
  }

  const themes = {
    default: {
      name: "Default",
      bg: "bg-white/80 dark:bg-slate-800/80",
      text: "text-gray-900 dark:text-white",
      accent: "border-teal-500"
    },
    ocean: {
      name: "Ocean",
      bg: "bg-blue-50/80 dark:bg-blue-900/20",
      text: "text-blue-900 dark:text-blue-100",
      accent: "border-blue-500"
    },
    forest: {
      name: "Forest",
      bg: "bg-green-50/80 dark:bg-green-900/20",
      text: "text-green-900 dark:text-green-100",
      accent: "border-green-500"
    },
    sunset: {
      name: "Sunset",
      bg: "bg-orange-50/80 dark:bg-orange-900/20",
      text: "text-orange-900 dark:text-orange-100",
      accent: "border-orange-500"
    },
    purple: {
      name: "Purple",
      bg: "bg-purple-50/80 dark:bg-purple-900/20",
      text: "text-purple-900 dark:text-purple-100",
      accent: "border-purple-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2 font-medium ${
              activeTab === "content"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab("seo")}
            className={`px-4 py-2 font-medium ${
              activeTab === "seo"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            SEO
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 font-medium ${
              activeTab === "settings"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content Tab */}
      {activeTab === "content" && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={post.title || ""}
              onChange={(e) => updatePost("title", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter an engaging title..."
            />
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              rows={3}
              value={post.excerpt || ""}
              onChange={(e) => updatePost("excerpt", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Brief description that hooks your readers..."
            />
          </div>

          {/* Tiptap Rich Text Editor */}
          <TiptapEditor
            content={post.content || ""}
            onChange={(content) => updatePost("content", content)}
            placeholder="Start writing your amazing blog post..."
            className="min-h-[600px]"
          />

          {/* Academic References Section */}
          <div className={`border border-gray-300 dark:border-gray-600 rounded-xl ${themes[selectedTheme as keyof typeof themes].bg} backdrop-blur-xl p-6 transition-all duration-300`}>
            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
              <Quote className="w-5 h-5 mr-2" />
              References
            </h4>
            
            {/* Add New Reference Form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
              <h5 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">Add New Reference</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Author/Screen Name"
                  value={citationForm.author}
                  onChange={(e) => setCitationForm(prev => ({ ...prev, author: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Title of Post/Article"
                  value={citationForm.title}
                  onChange={(e) => setCitationForm(prev => ({ ...prev, title: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Blog/Website Name"
                  value={citationForm.description}
                  onChange={(e) => setCitationForm(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <input
                  type="date"
                  placeholder="Publication Date"
                  value={citationForm.publishedDate}
                  onChange={(e) => setCitationForm(prev => ({ ...prev, publishedDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="url"
                  placeholder="URL (https://...) - paste to auto-fill"
                  value={citationForm.url}
                  onChange={(e) => {
                    setCitationForm(prev => ({ ...prev, url: e.target.value }))
                    // Auto-extract metadata on paste
                    if (e.target.value.startsWith('http') && e.target.value.length > 10) {
                      handleUrlPaste(e.target.value)
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addCitation}
                  disabled={isLoadingCitation || (!citationForm.title.trim() && !citationForm.url.trim())}
                  className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-150 text-sm font-medium"
                >
                  {isLoadingCitation ? 'Loading...' : 'Add Reference'}
                </button>
              </div>
            </div>

            {/* References List */}
            {citations.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
                  Reference List ({citations.length})
                </h5>
                {citations.map((citation, index) => (
                  <motion.div
                    key={citation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-medium rounded-full mt-0.5">
                            {index + 1}
                          </span>
                          <div className="flex-1 space-y-1">
                            {/* Academic Citation Format */}
                            <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                              {citation.author && (
                                <span className="font-medium">{citation.author}. </span>
                              )}
                              {citation.title && (
                                <span className="italic">"{citation.title}." </span>
                              )}
                              {citation.description && (
                                <span className="font-medium">{citation.description}, </span>
                              )}
                              {citation.url && (
                                <>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {new Date().toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}. 
                                  </span>
                                  <a 
                                    href={citation.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline ml-1"
                                  >
                                    {citation.url}
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCitation(citation.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-150 ml-3"
                        title="Remove reference"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <TagKeywordManager
            label="Tags"
            items={tags}
            inputValue={newTag}
            setInputValue={setNewTag}
            handleAdd={handleAddTag}
            handleRemove={handleRemoveTag}
            placeholder="Add a tag"
          />
        </motion.div>
      )}

      {/* SEO Tab */}
      {activeTab === "seo" && (
        <div className="space-y-4">
          {post.id && (
            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-2">
                Slug
              </label>
              <input
                type="text"
                id="slug"
                value={post.slug || ""}
                onChange={(e) => updatePost("slug", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-xl bg-white dark:bg-slate-800 backdrop-blur-xl"
                placeholder="url-friendly-slug"
              />
            </div>
          )}

          <div>
            <label htmlFor="meta-description" className="block text-sm font-medium mb-2">
              Meta Description
            </label>
            <textarea
              id="meta-description"
              rows={3}
              value={post.meta_description || ""}
              onChange={(e) => updatePost("meta_description", e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-xl bg-white dark:bg-slate-800 backdrop-blur-xl"
              placeholder="SEO meta description (150-160 characters)"
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(post.meta_description || "").length}/160 characters
            </p>
          </div>

          <TagKeywordManager
            label="Meta Keywords"
            items={keywords}
            inputValue={newKeyword}
            setInputValue={setNewKeyword}
            handleAdd={handleAddKeyword}
            handleRemove={handleRemoveKeyword}
            placeholder="Add a keyword"
          />
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="author" className="block text-sm font-medium mb-2">
              Author
            </label>
            <input
              type="text"
              id="author"
              value={post.author || ""}
              onChange={(e) => updatePost("author", e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-xl bg-white dark:bg-slate-800 backdrop-blur-xl"
              placeholder="Author name"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="published"
              checked={post.published || false}
              onChange={(e) => updatePost("published", e.target.checked)}
              className="rounded border-input dark:bg-slate-800 dark:border-slate-800"
            />
            <label htmlFor="published" className="text-sm font-medium">
              Published
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="featured"
              checked={post.featured || false}
              onChange={(e) => updatePost("featured", e.target.checked)}
              className="rounded border-input dark:bg-slate-800 dark:border-slate-800"
            />
            <label htmlFor="featured" className="text-sm font-medium">
              Featured
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-border">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-xl bg-red-950/50 hover:bg-red-700 hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSaveClick}
          disabled={isSaving || !post.title || !post.content}
          className="px-4 py-2 text-white disabled:text-white bg-teal-700/80 hover:bg-teal-700 hover:text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed active:bg-teal-700 active:text-white flex items-center"
        >
          <Save className="w-4 h-4 mr-2 " />
          {isSaving ? "Saving..." : post.id ? "Update Post" : "Create Post"}
        </button>
      </div>
    </div>
  )
}
