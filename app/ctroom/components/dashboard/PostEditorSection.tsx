"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAllPosts, useCreatePost, useUpdatePost } from "../../hooks/useQueries"
import PostEditor from "../PostEditor"
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

interface PostEditorSectionProps {
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message?: string }) => void
}

export function PostEditorSection({ addToast }: PostEditorSectionProps) {
  const searchParams = useSearchParams()
  const { data: allPosts, isLoading: allPostsLoading } = useAllPosts()
  const { mutateAsync: createPost } = useCreatePost()
  const { mutateAsync: updatePost } = useUpdatePost()
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  
  // Get the current user's email to use as author
  useEffect(() => {
    async function getUserEmail() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentUser(session.user.email || 'anonymous@user.com')
      } else {
        setCurrentUser('anonymous@user.com') // Fallback
      }
    }
    
    getUserEmail()
  }, [])
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{searchParams.get('edit') ? 'Edit Post' : 'Create New Post'}</CardTitle>
          <CardDescription>Use the MDX editor to create or edit your post</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/ctroom?section=posts'}
        >
          Back to Posts
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {searchParams.get('edit') ? (
          // Edit existing post
          allPostsLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <PostEditor
              initialPost={(() => {
                const postId = searchParams.get('edit')
                const post = allPosts?.find(p => p.id === postId)
                return post ? {
                  id: post.id,
                  title: post.title,
                  slug: post.slug,
                  content: post.content,
                  excerpt: post.excerpt || '',
                  tags: post.tags || [],
                  published: post.published,
                  author: post.author
                } : undefined
              })()}
              onSave={async (post) => {
                try {
                  if (post.id) {
                    await updatePost({
                      id: post.id,
                      post: {
                        ...post,
                        // Include author if it's missing in the post object
                        author: post.author || currentUser || 'anonymous@user.com',
                        updated_at: new Date().toISOString()
                      }
                    })
                    addToast({
                      type: 'success',
                      title: 'Post updated',
                      message: `Successfully updated "${post.title}"`
                    })
                  } else {
                    await createPost({
                      ...post,
                      author: currentUser || 'anonymous@user.com',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })
                    addToast({
                      type: 'success',
                      title: 'Post created',
                      message: `Successfully created "${post.title}"`
                    })
                  }
                  window.location.href = '/ctroom?section=posts'
                } catch (error) {
                  console.error('Error saving post:', error)
                  addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to save post'
                  })
                }
              }}
            />
          )
        ) : (
          // Create new post
          <PostEditor
            initialPost={{
              title: '',
              slug: '',
              content: '# New Post\n\nStart writing here...',
              excerpt: '',
              tags: [],
              published: false
            }}
            onSave={async (post) => {
              try {
                await createPost({
                  ...post,
                  author: currentUser || 'anonymous@user.com',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                addToast({
                  type: 'success',
                  title: 'Post created',
                  message: `Successfully created "${post.title}"`
                })
                window.location.href = '/ctroom?section=posts'
              } catch (error) {
                console.error('Error creating post:', error)
                addToast({
                  type: 'error',
                  title: 'Error',
                  message: 'Failed to create post'
                })
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
