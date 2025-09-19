"use client"

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import React, { useState, useRef, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'

// TypeScript declarations for lord-icon
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': {
        src?: string
        trigger?: string
        style?: React.CSSProperties
        colors?: string
      }
    }
  }
}

// No external script loading needed

interface ResizableImageComponentProps {
  node: any
  updateAttributes: (attrs: any) => void
  selected: boolean
}

export function ResizableImageComponent({ node, updateAttributes, selected }: ResizableImageComponentProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [dimensions, setDimensions] = useState({
    width: node.attrs.width || 'auto',
    height: node.attrs.height || 'auto'
  })
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { src, alt, caption, captionPosition, alignment, fullScreen } = node.attrs

  // Load Lordicon script for banner icons
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="lordicon"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdn.lordicon.com/lordicon.js'
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  const getAlignmentClasses = () => {
    switch (alignment) {
      case 'center':
        return 'flex justify-center'
      case 'right':
        return 'flex justify-end'
      default:
        return 'flex justify-start'
    }
  }

  // Icon mapping for image banners - matches News Coo Chronicles theme
  const getIconForCaption = (caption: string) => {
    const lowerCaption = caption.toLowerCase()
    
    if (lowerCaption.includes('captain') || lowerCaption.includes('log') || lowerCaption.includes('intro')) {
      return 'https://cdn-icons-gif.flaticon.com/13890/13890901.gif'
    } else if (lowerCaption.includes('treasure') || lowerCaption.includes('map') || lowerCaption.includes('content')) {
      return 'https://cdn-icons-gif.flaticon.com/19013/19013922.gif'
    } else if (lowerCaption.includes('marine') || lowerCaption.includes('intelligence') || lowerCaption.includes('tech') || lowerCaption.includes('news')) {
      return 'https://cdn-icons-gif.flaticon.com/15557/15557320.gif'
    } else if (lowerCaption.includes('bounty') || lowerCaption.includes('hunt') || lowerCaption.includes('challenge')) {
      return 'https://cdn-icons-gif.flaticon.com/13932/13932790.gif'
    } else if (lowerCaption.includes('crew') || lowerCaption.includes('spotlight') || lowerCaption.includes('community')) {
      return 'https://cdn-icons-gif.flaticon.com/11186/11186871.gif'
    } else if (lowerCaption.includes('devil') || lowerCaption.includes('fruit') || lowerCaption.includes('power') || lowerCaption.includes('tool')) {
      return 'https://cdn-icons-gif.flaticon.com/11186/11186848.gif'
    } else if (lowerCaption.includes('news') || lowerCaption.includes('coo') || lowerCaption.includes('delivery') || lowerCaption.includes('update')) {
      return 'https://cdn-icons-gif.flaticon.com/11188/11188599.gif'
    }
    
    // Default to anchor for News Coo theme
    return 'https://cdn-icons-gif.flaticon.com/13890/13890901.gif'
  }

  const renderImageWithBanner = () => {

    if (!caption) {
      // No banner - render image normally with proper alignment
      return (
        <div className={`${fullScreen ? 'w-full' : ''} ${alignment === 'center' ? 'flex justify-center' : alignment === 'right' ? 'flex justify-end' : 'flex justify-start'}`}>
          <img
            ref={imageRef}
            src={src}
            alt={alt || ''}
            className={`${fullScreen ? 'w-full' : 'max-w-full'} h-auto rounded-lg border border-amber-300 dark:border-amber-700 cursor-pointer`}
            style={{
              width: fullScreen ? '100%' : dimensions.width === 'auto' ? 'auto' : `${dimensions.width}px`,
              height: dimensions.height === 'auto' ? 'auto' : `${dimensions.height}px`,
              objectFit: 'contain'
            }}
            draggable={false}
          />
        </div>
      )
    }

    const iconUrl = getIconForCaption(caption)
    
    const bannerHeader = (
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 border-b-2 border-black">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="text-white font-black text-2xl tracking-wider uppercase drop-shadow-2xl">
              {caption}
            </div>
          </div>
        </div>
      </div>
    )

    const imageContainer = (
      <div className={`p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 min-h-[400px] flex items-center justify-center`}>
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          className={`${fullScreen ? 'w-full' : 'max-w-full max-h-[350px]'} h-auto rounded-xl cursor-pointer shadow-lg border-2 border-gray-300 dark:border-gray-600`}
          style={{
            width: fullScreen ? '100%' : dimensions.width === 'auto' ? 'auto' : `${dimensions.width}px`,
            height: dimensions.height === 'auto' ? 'auto' : `${dimensions.height}px`,
            objectFit: 'contain'
          }}
          draggable={false}
        />
      </div>
    )

    // With banner - image is contained inside the banner
    return (
      <div className={`w-full max-w-none bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 border-4 border-black rounded-2xl shadow-2xl overflow-hidden`}>
        {captionPosition === 'above' ? bannerHeader : imageContainer}
        {captionPosition === 'above' ? imageContainer : bannerHeader}
      </div>
    )
  }

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = imageRef.current?.offsetWidth || 0
    const startHeight = imageRef.current?.offsetHeight || 0

    const handleMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight

      if (direction.includes('right')) {
        newWidth = Math.max(100, startWidth + deltaX)
      }
      if (direction.includes('left')) {
        newWidth = Math.max(100, startWidth - deltaX)
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(100, startHeight + deltaY)
      }
      if (direction.includes('top')) {
        newHeight = Math.max(100, startHeight - deltaY)
      }

      // Maintain aspect ratio for corner handles
      if (direction.includes('right') || direction.includes('left')) {
        const aspectRatio = startHeight / startWidth
        newHeight = newWidth * aspectRatio
      }

      setDimensions({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      updateAttributes({ 
        width: dimensions.width, 
        height: dimensions.height 
      })
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <NodeViewWrapper className={`resizable-image ${selected ? 'ProseMirror-selectednode' : ''}`}>
      <div className={`my-4 ${fullScreen ? 'w-full' : getAlignmentClasses()}`}>
        <div className={`flex flex-col gap-2 ${fullScreen ? 'w-full max-w-none' : 'max-w-full'}`}>
          <div 
            ref={containerRef}
            className={`relative ${caption || fullScreen ? 'block w-full' : 'inline-block'} group ${selected ? 'ring-2 ring-amber-400' : ''}`}
            style={{ 
              width: dimensions.width === 'auto' ? 'auto' : `${dimensions.width}px`,
              height: dimensions.height === 'auto' ? 'auto' : `${dimensions.height}px`
            }}
            onDoubleClick={() => {
              console.log('Double-clicked image - should open edit modal')
              // Pass image data to parent for editing
              const imageData = {
                src,
                alt,
                caption,
                captionPosition,
                alignment,
                fullScreen
              }
              // We need to communicate with the editor to open edit modal
              // For now, we'll use a custom event
              const editEvent = new CustomEvent('editImage', { 
                detail: imageData,
                bubbles: true 
              })
              document.dispatchEvent(editEvent)
            }}
          >
            {/* Render image with or without banner */}
            {renderImageWithBanner()}
        
        {/* Resize handles - only show when selected */}
        {selected && (
          <>
            {/* Corner handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-amber-500 border border-white rounded-full cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'top-left')}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border border-white rounded-full cursor-ne-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'top-right')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-amber-500 border border-white rounded-full cursor-sw-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 border border-white rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
            />
            
            {/* Edge handles */}
            <div
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-amber-500 border border-white rounded-full cursor-n-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'top')}
            />
            <div
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-amber-500 border border-white rounded-full cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'bottom')}
            />
            <div
              className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-amber-500 border border-white rounded-full cursor-w-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            />
            <div
              className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-amber-500 border border-white rounded-full cursor-e-resize opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, 'right')}
            />
          </>
        )}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

// Resizable Image Node Definition
export const ResizableImage = Node.create({
  name: 'resizableImage',
  
  group: 'inline',
  
  inline: true,
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
      captionPosition: {
        default: 'below',
      },
      alignment: {
        default: 'left',
      },
      fullScreen: {
        default: false,
      },
      width: {
        default: 'auto',
      },
      height: {
        default: 'auto',
      },
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element: any) => ({
          src: element.getAttribute('src'),
          alt: element.getAttribute('alt'),
          width: element.getAttribute('width') || 'auto',
          height: element.getAttribute('height') || 'auto',
        }),
      },
    ]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
  
})
