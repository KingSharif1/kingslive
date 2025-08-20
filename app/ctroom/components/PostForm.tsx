"use client"

import { useState } from "react"
import { Save, X } from "lucide-react"
import { BlogPost } from "../types"
import TagKeywordManager from "./TagKeywordManager"

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
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={post.title || ""}
              onChange={(e) => updatePost("title", e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-xl bg-white dark:bg-slate-800 backdrop-blur-xl"
              placeholder="Enter post title"
            />
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              rows={3}
              value={post.excerpt || ""}
              onChange={(e) => updatePost("excerpt", e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-xl bg-white dark:bg-slate-800 backdrop-blur-xl"
              placeholder="Brief description of the post"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Content *
            </label>
            <textarea
              id="content"
              rows={12}
              value={post.content || ""}
              onChange={(e) => updatePost("content", e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-xl bg-white dark:bg-slate-800 font-mono text-sm backdrop-blur-xl "
              placeholder="Write your post content here..."
            />
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
        </div>
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
