import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataService } from '../services/dataService'
import { BlogPost, Comment, Category } from '../types'

// Enhanced error handling for queries
const defaultQueryOptions = {
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors (client errors)
    if (error?.status >= 400 && error?.status < 500) {
      return false
    }
    // Retry up to 3 times for other errors
    return failureCount < 3
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
}

// Query keys for consistent caching
export const queryKeys = {
  posts: ['posts'] as const,
  comments: ['comments'] as const,
  categories: ['categories'] as const,
  stats: ['stats'] as const,
  post: (id: string) => ['posts', id] as const,
}

// Posts queries
export const usePosts = (page: number = 0, limit: number = 5) => {
  return useQuery({
    queryKey: [...queryKeys.posts, page, limit],
    queryFn: () => DataService.fetchPosts(page, limit),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...defaultQueryOptions,
  })
}

// For components that need all posts (like analytics)
export function useAllPosts() {
  return useQuery({
    queryKey: ['posts', 'all'],
    queryFn: DataService.fetchAllPosts,
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache (replaces cacheTime in v5)
    ...defaultQueryOptions,
  })
}

export const useComments = () => {
  return useQuery({
    queryKey: queryKeys.comments,
    queryFn: DataService.fetchComments,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...defaultQueryOptions,
  })
}

export const useArchivedComments = () => {
  return useQuery({
    queryKey: ['comments', 'archived'],
    queryFn: DataService.fetchArchivedComments,
    staleTime: 5 * 60 * 1000, // 5 minutes (archived comments change less frequently)
    ...defaultQueryOptions,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: DataService.fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes for categories (rarely change)
    ...defaultQueryOptions,
  })
}

export const useStats = () => {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: DataService.getStats,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...defaultQueryOptions,
  })
}

// Post mutations
export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (post: Partial<BlogPost>) => DataService.createPost(post),
    onSuccess: () => {
      // Invalidate and refetch posts and stats
      queryClient.invalidateQueries({ queryKey: queryKeys.posts })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, post }: { id: string; post: Partial<BlogPost> }) => 
      DataService.updatePost(id, post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => DataService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

// Comment mutations
export function useApproveComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => DataService.approveComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

export function useArchiveComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => DataService.archiveComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments })
      queryClient.invalidateQueries({ queryKey: ['comments', 'archived'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => DataService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments })
      queryClient.invalidateQueries({ queryKey: ['comments', 'archived'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}

export function useUnarchiveComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => DataService.unarchiveComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments })
      queryClient.invalidateQueries({ queryKey: ['comments', 'archived'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.stats })
    },
  })
}
