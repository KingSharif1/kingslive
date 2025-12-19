"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface PostEditorProps {
  initialPost?: {
    id?: string
    title: string
    slug: string
    content: string
    excerpt: string
    tags: string[]
    published: boolean
    featuredImage?: string
    author?: string
  }
  onSave: (post: any) => Promise<void>
}

export default function PostEditor({
  initialPost = {
    title: "",
    slug: "",
    content: "Start writing your blog post here...",
    excerpt: "",
    tags: [],
    published: false
  },
  onSave
}: PostEditorProps) {
  const [post, setPost] = useState(initialPost)
  const [newTag, setNewTag] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave(post)
    } catch (error) {
      console.error("Error saving post:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setPost(prev => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (newTag && !post.tags.includes(newTag)) {
      setPost(prev => ({ ...prev, tags: [...prev.tags, newTag] }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setPost(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const generateSlug = () => {
    const slug = post.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')

    handleChange('slug', slug)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">
          {initialPost.id ? "Edit Post" : "Create Post"}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={post.published}
              onCheckedChange={(checked) => handleChange("published", checked)}
            />
            <Label htmlFor="published">
              {post.published ? "Published" : "Draft"}
            </Label>
          </div>
          <Button
            type="submit"
            id="post-form-submit"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label>Title</Label>
          <Input
            id="title"
            value={post.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Post title"
            required
          />
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="slug">Slug</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={generateSlug}
              type="button"
            >
              Generate from title
            </Button>
          </div>
          <Input
            id="slug"
            value={post.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            placeholder="post-url-slug"
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Input
            id="excerpt"
            value={post.excerpt}
            onChange={(e) => handleChange("excerpt", e.target.value)}
            placeholder="Brief description of the post"
          />
        </div>

        <div className="grid gap-3">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyDown={(e) => e.key === "Enter" && addTag()}
            />
            <Button type="button" onClick={addTag} variant="outline">Add</Button>
          </div>
        </div>

        <div className="grid gap-3">
          <Label>Content</Label>
          <div className="rounded-lg border p-2">
            <Textarea
              value={post.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Write your blog post content here..."
              className="min-h-[500px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Note: For rich blog content, use Sanity Studio at /studio
          </p>
        </div>
      </div>
    </form>
  )
}
