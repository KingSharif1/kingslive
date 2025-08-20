"use client"

import { motion } from "framer-motion"
import { Edit, Trash2, Eye, BarChart } from "lucide-react"
import Link from "next/link"
import { BlogPost } from "../types"

interface PostListProps {
  posts: BlogPost[]
  handleEditPost: (post: BlogPost) => void
  handleDeletePost: (postId: string) => void
}

export default function PostList({ posts, handleEditPost, handleDeletePost }: PostListProps) {
  return (
    <div className="bg-gray-300 dark:bg-gray-800 shadow rounded-xl overflow-hidden backdrop-blur-xl backdrop-contrast-150 backdrop-brightness-150">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Blog Posts
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Manage your blog content
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Views
              </th>
              <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-300 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {posts.map((post) => (
              <motion.tr 
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{post.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{post.slug}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    post.published 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {post.views}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <Link 
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
