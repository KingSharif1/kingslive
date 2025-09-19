"use client"

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import React, { useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'

// URL Embed Node Component
const URLEmbedComponent = ({ node, updateAttributes, selected, editor }: any) => {
  const [isLoading, setIsLoading] = useState(false)
  const [embedData, setEmbedData] = useState(node.attrs.embedData || null)
  const [isEditing, setIsEditing] = useState(false)
  const isEditable = editor?.isEditable ?? true
  
  const { url } = node.attrs

  const fetchEmbedData = async (url: string) => {
    setIsLoading(true)
    try {
      // Simple URL preview - in production you'd use a proper service
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        const embedInfo = {
          title: data.data.title || url,
          description: data.data.description || '',
          image: data.data.image?.url || '',
          favicon: data.data.logo?.url || '',
          domain: new URL(url).hostname
        }
        setEmbedData(embedInfo)
        updateAttributes({ embedData: embedInfo })
      }
    } catch (error) {
      console.error('Failed to fetch embed data:', error)
    }
    setIsLoading(false)
  }

  React.useEffect(() => {
    if (url && !embedData) {
      fetchEmbedData(url)
    }
  }, [url, embedData])

  // Sync local state with node attributes
  React.useEffect(() => {
    if (node.attrs.embedData && node.attrs.embedData !== embedData) {
      setEmbedData(node.attrs.embedData)
    }
  }, [node.attrs.embedData])

  return (
    <NodeViewWrapper className={`url-embed ${selected ? 'ProseMirror-selectednode' : ''}`}>
      <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4 my-4 hover:shadow-lg transition-all duration-200">
        {isLoading ? (
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
            <div className="animate-spin w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full"></div>
            <span>Loading preview...</span>
          </div>
        ) : embedData ? (
          <div>
            {isEditing && isEditable ? (
              <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                <div>
                  <label className="block text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={embedData.title || ''}
                    onChange={(e) => {
                      const newEmbedData = { ...embedData, title: e.target.value }
                      setEmbedData(newEmbedData)
                      updateAttributes({ embedData: newEmbedData })
                    }}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-amber-300 dark:border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Description</label>
                  <textarea
                    value={embedData.description || ''}
                    onChange={(e) => {
                      const newEmbedData = { ...embedData, description: e.target.value }
                      setEmbedData(newEmbedData)
                      updateAttributes({ embedData: newEmbedData })
                    }}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-amber-300 dark:border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={embedData.image || ''}
                    onChange={(e) => {
                      const newEmbedData = { ...embedData, image: e.target.value }
                      setEmbedData(newEmbedData)
                      updateAttributes({ embedData: newEmbedData })
                    }}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-amber-300 dark:border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter image URL"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      if (url && url !== embedData.url) {
                        fetchEmbedData(url)
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {isEditable && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    className="absolute top-2 right-2 z-10 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors shadow-lg"
                  >
                    ✏️ Edit
                  </button>
                )}
                <a href={url} target="_blank" rel="noopener noreferrer" className="block hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg p-3 transition-colors">
                  <div className="flex gap-4">
                    {embedData.image && (
                      <div className="flex-shrink-0">
                        <img 
                          src={embedData.image} 
                          alt={embedData.title}
                          className="w-24 h-24 object-cover rounded-lg border border-amber-300 dark:border-amber-700"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {embedData.favicon && (
                          <img src={embedData.favicon} alt="" className="w-4 h-4" />
                        )}
                        <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                          {embedData.domain}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                        {embedData?.title || url || 'Untitled'}
                      </h3>
                      {embedData.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                          {embedData.description}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
            <span className="font-medium">🔗 {url}</span>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

// URL Embed Node Definition
export const URLEmbedNode = Node.create({
  name: 'urlEmbed',
  
  group: 'block',
  
  atom: true,
  
  addAttributes() {
    return {
      url: {
        default: '',
      },
      embedData: {
        default: null,
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="url-embed"]',
        getAttrs: (element: any) => {
          const url = element.getAttribute('data-url')
          const embedDataStr = element.getAttribute('data-embed-data')
          let embedData = null
          
          try {
            embedData = embedDataStr ? JSON.parse(embedDataStr) : null
          } catch (e) {
            console.warn('Failed to parse embed data:', e)
          }
          
          return { url, embedData }
        }
      },
    ]
  },
  
  renderHTML({ HTMLAttributes, node }) {
    const { url, embedData } = node.attrs
    return ['div', mergeAttributes(HTMLAttributes, { 
      'data-type': 'url-embed',
      'data-url': url,
      'data-embed-data': JSON.stringify(embedData),
      class: 'url-embed'
    })]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(URLEmbedComponent)
  },
  
  addCommands() {
    return {
      setURLEmbed: (attributes: any) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        })
      },
    } as any
  },
})
