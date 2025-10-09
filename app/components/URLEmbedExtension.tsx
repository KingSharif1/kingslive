"use client"

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import React, { useState } from 'react'
import { NodeViewWrapper } from '@tiptap/react'

// URL Embed Node Component
const URLEmbedComponent = ({ node, updateAttributes, selected, editor }: any) => {
  // Fix: Handle case where embedData might be a string "[object Object]"
  let initialEmbedData = node.attrs.embedData
  if (typeof initialEmbedData === 'string' && initialEmbedData === '[object Object]') {
    initialEmbedData = null
  }
  
  const [isLoading, setIsLoading] = useState(false)
  const [embedData, setEmbedData] = useState(initialEmbedData || null)
  const [isEditing, setIsEditing] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const isEditable = editor?.isEditable ?? true
  
  const { url } = node.attrs
  
  // Component initialization complete

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
    setHasInitialized(true)
  }

  React.useEffect(() => {
    if (url && !embedData && !hasInitialized) {
      fetchEmbedData(url)
    } else if (!hasInitialized) {
      // No valid embed data, mark as initialized to prevent infinite loops
      setHasInitialized(true)
    }
  }, [url, embedData, hasInitialized])

  // Sync local state with node attributes
  React.useEffect(() => {
    if (node.attrs.embedData && node.attrs.embedData !== embedData) {
      setEmbedData(node.attrs.embedData)
    }
  }, [node.attrs.embedData])

  return (
    <NodeViewWrapper className={`url-embed w-[80%] m-auto ${selected ? 'ProseMirror-selectednode' : ''}`}>
      <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl my-4 hover:shadow-lg transition-all duration-200 backdrop-blur-3xl backdrop-saturate-200 backdrop-opacity-100">
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
                    className="w-full px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-amber-300 dark:border-amber-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    className="w-full px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-amber-300 dark:border-amber-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
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
                    className="w-full px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-amber-300 dark:border-amber-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter image URL"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors"
                  >
                    Done  
                  </button>
                  <button
                    onClick={() => {
                      if (url && url !== embedData.url) {
                        fetchEmbedData(url)
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors"
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
                    className="absolute top-2 right-2 z-10 px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-xl transition-colors shadow-lg"
                  >
                    ✏️ Edit
                  </button>
                )}
                <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20  p-2 transition-colors">
                  <div className="flex gap-4">

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                        {embedData?.title || (hasInitialized ? url : 'Loading...')}
                      </h3>
                      {embedData.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                          {embedData.description}
                        </p>
                      )}
                    </div>
                    {embedData.image && (
                      <div className="flex-shrink-0">
                        <img 
                          src={embedData.image} 
                          alt={embedData.title}
                          className="w-48 h-48 object-cover rounded-xl"
                        />
                      </div>
                    )}                    
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
          const url = element.getAttribute('data-url') || element.getAttribute('url')
          const embedDataStr = element.getAttribute('data-embed-data')
          let embedData = null
          
          try {
            if (embedDataStr && embedDataStr !== '[object Object]' && embedDataStr !== '"[object Object]"') {
              // Decode HTML entities
              const decodedStr = embedDataStr.replace(/&quot;/g, '"').replace(/&amp;/g, '&')
              embedData = JSON.parse(decodedStr)
            }
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
    
    // Ensure embedData is properly serialized
    let embedDataStr = null
    if (embedData && typeof embedData === 'object' && embedData.title) {
      embedDataStr = JSON.stringify(embedData)
    }
    
    const attributes: any = { 
      'data-type': 'url-embed',
      'data-url': url,
      class: 'url-embed'
    }
    
    // Only add data-embed-data if we have valid data
    if (embedDataStr) {
      attributes['data-embed-data'] = embedDataStr
    }
    
    return ['div', mergeAttributes(HTMLAttributes, attributes)]
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
