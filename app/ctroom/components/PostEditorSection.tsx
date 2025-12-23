"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PostEditor from "./PostEditor"
import { createPost, updatePost, type Post } from "../actions/posts"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface PostEditorSectionProps {
  initialPost?: Post
  isEditing?: boolean
}

export default function PostEditorSection({ 
  initialPost, 
  isEditing = false 
}: PostEditorSectionProps) {
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  
  const handleSave = async (post: Post) => {
    try {
      setIsSaving(true)
      
      if (isEditing && initialPost?.id) {
        // Update existing post
        await updatePost(initialPost.id, post)
        toast.success("Post updated successfully")
        router.push("/ctroom/dashboard")
      } else {
        // Create new post
        const newPost = await createPost(post)
        toast.success("Post created successfully")
        router.push("/ctroom/dashboard")
      }
    } catch (error) {
      console.error("Error saving post:", error)
      toast.error("Failed to save post")
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Post" : "Create New Post"}
        </h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/ctroom/dashboard")}
        >
          Cancel
        </Button>
      </div>
      
      <PostEditor 
        initialPost={initialPost} 
        onSave={handleSave}
      />
      
      <div className="flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={() => router.push("/ctroom/dashboard")}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => document.getElementById("post-form-submit")?.click()}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : isEditing ? "Update Post" : "Create Post"}
        </Button>
      </div>
    </div>
  )
}
