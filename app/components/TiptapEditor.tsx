"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ListItem from '@tiptap/extension-list-item'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { ResizableImage } from './ResizableImage'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import { BannerNode, NewspaperQuote } from './NewspaperExtensions'
import { URLEmbedNode } from './URLEmbedExtension'
import { ImageModal, URLEmbedModal, LinkModal } from './EditorModals'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Newspaper,
  MessageSquareQuote,
  ImageIcon,
  Globe
} from 'lucide-react'
import React, { useState } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export default function TiptapEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  className = "",
  editable = true 
}: TiptapEditorProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageEditModalOpen, setImageEditModalOpen] = useState(false)
  const [editingImageData, setEditingImageData] = useState<any>(null)
  const [urlEmbedModalOpen, setUrlEmbedModalOpen] = useState(false)
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  
  const handleEditImage = (imageData: any) => {
    console.log('Opening edit modal for image:', imageData)
    setEditingImageData(imageData)
    setImageEditModalOpen(true)
  }

  // Listen for image edit events
  React.useEffect(() => {
    const handleEditImageEvent = (event: any) => {
      console.log('Received editImage event:', event.detail)
      handleEditImage(event.detail)
    }

    document.addEventListener('editImage', handleEditImageEvent)
    return () => document.removeEventListener('editImage', handleEditImageEvent)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
        bulletList: false, // We'll configure these separately
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-outside ml-6 space-y-1 pl-2',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-outside ml-6 space-y-1 pl-2',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'leading-relaxed',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-teal-600 dark:text-teal-400 hover:underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CodeBlockLowlight.configure({
        lowlight: createLowlight(),
        HTMLAttributes: {
          class: 'bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-xl overflow-x-auto my-4 border border-gray-700',
        },
      }),
      ResizableImage,
      BannerNode,
      NewspaperQuote,
      URLEmbedNode,
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-lg dark:prose-invert max-w-none focus:outline-none ${className}`,
      },
    },
  })

  if (!editor) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-xl"></div>
  }

  // Debug: Log editor state
  // console.log('Editor loaded:', !!editor, 'Editable:', editor?.isEditable)
  
  // Test if editor commands work
  const testBold = () => {
    console.log('Testing bold command...')
    console.log('Editor can run commands:', editor?.can().toggleBold())
    console.log('Bold is active:', editor?.isActive('bold'))
    const result = editor?.chain().focus().toggleBold().run()
    console.log('Bold command result:', result)
  }

  const handleInsertImage = (src: string, alt?: string, caption?: string, captionPosition?: 'above' | 'below', alignment?: 'left' | 'center' | 'right', fullScreen?: boolean) => {
    console.log('TiptapEditor handleInsertImage called with:', { src, alt, caption, captionPosition, alignment, fullScreen })
    console.log('Editor exists:', !!editor)
    
    if (editingImageData) {
      // Update existing image
      editor?.chain().focus().updateAttributes('resizableImage', {
        src, alt, caption, captionPosition: captionPosition || 'below', alignment: alignment || 'left', fullScreen: fullScreen || false
      }).run()
      setEditingImageData(null)
      setImageEditModalOpen(false)
    } else {
      // Insert new image
      const result = editor?.chain().focus().insertContent({
        type: 'resizableImage',
        attrs: { src, alt, caption, captionPosition: captionPosition || 'below', alignment: alignment || 'left', fullScreen: fullScreen || false }
      }).run()
      console.log('Insert command result:', result)
    }
  }

  const handleInsertLink = (url: string, text?: string) => {
    if (text) {
      editor?.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
    } else {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  const handleInsertURLEmbed = (url: string) => {
    (editor?.chain().focus() as any).setURLEmbed({ url }).run()
  }

  const addBanner = () => {
    if (!editor) return
    
    editor.chain().focus().insertContent(`
      <div data-type="banner" data-title="Breaking News" data-subtitle="Latest Updates" data-icon-name="introduction" data-color="blue">
        Breaking News
      </div>
    `).run()
  }

  const addNewspaperQuote = () => {
    if (!editor) return
    
    editor.chain().focus().insertContent(`
      <blockquote data-type="newspaper-quote" data-text="Enter your quote here..." data-author="Author Name" data-source="Source Publication">
        Enter your quote here...
      </blockquote>
    `).run()
  }

  if (!editable) {
    return (
      <div className={`newspaper-content ${className}`}>
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <>
      <div className="w-full">
        <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-amber-950/30 rounded-xl shadow-lg border border-amber-200 dark:border-amber-800">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-4 border-b border-amber-200 dark:border-amber-700 bg-gradient-to-r from-amber-200/50 via-amber-100/30 to-amber-200/50 dark:from-amber-900/40 dark:via-amber-800/20 dark:to-amber-900/40">
            {/* Text Formatting */}
            <div className="flex items-center gap-2 border-r-2 border-amber-300 dark:border-amber-700 pr-4">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md ${
                  editor.isActive('bold') ? 'bg-amber-300 dark:bg-amber-700 shadow-md text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'
                }`}
                title="Bold"
              >
                <Bold className="w-5 h-5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md ${
                  editor.isActive('italic') ? 'bg-amber-300 dark:bg-amber-700 shadow-md text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'
                }`}
                title="Italic"
              >
                <Italic className="w-5 h-5" />
              </button>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-2 border-r-2 border-amber-300 dark:border-amber-700 pr-4">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-amber-300 dark:bg-amber-700 shadow-md text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'
                }`}
                title="Heading 1"
              >
                <Heading1 className="w-5 h-5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-amber-300 dark:bg-amber-700 shadow-md text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'
                }`}
                title="Heading 2"
              >
                <Heading2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md ${
                  editor.isActive('heading', { level: 3 }) ? 'bg-amber-300 dark:bg-amber-700 shadow-md text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'
                }`}
                title="Heading 3"
              >
                <Heading3 className="w-5 h-5" />
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-2 border-r-2 border-amber-300 dark:border-amber-700 pr-4">
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md ${
                  editor.isActive('bulletList') ? 'bg-amber-300 dark:bg-amber-700 shadow-md text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'
                }`}
                title="Bullet List"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md ${
                  editor.isActive('orderedList') ? 'bg-amber-300 dark:bg-amber-700 shadow-md text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'
                }`}
                title="Numbered List"
              >
                <ListOrdered className="w-5 h-5" />
              </button>
            </div>

            {/* Media & Links */}
            <div className="flex items-center gap-2 border-r-2 border-amber-300 dark:border-amber-700 pr-4">
              <button
                onClick={() => {
                  console.log('Image button clicked, opening modal')
                  setImageModalOpen(true)
                }}
                className="p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md text-gray-700 dark:text-gray-300"
                title="Add Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLinkModalOpen(true)}
                className={`p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md ${
                  editor.isActive('link') ? 'bg-amber-300 dark:bg-amber-700 shadow-md text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'
                }`}
                title="Add Link"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setUrlEmbedModalOpen(true)}
                className="p-3 rounded-lg transition-all duration-200 hover:bg-purple-200 dark:hover:bg-purple-800/50 hover:shadow-md text-purple-700 dark:text-purple-300"
                title="Embed URL with Preview"
              >
                <Globe className="w-5 h-5" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-3 rounded-lg transition-all duration-200 hover:bg-amber-200 dark:hover:bg-amber-800/50 hover:shadow-md ${
                  editor.isActive('codeBlock') ? 'bg-amber-300 dark:bg-amber-700 shadow-md text-amber-900 dark:text-amber-100' : 'text-gray-700 dark:text-gray-300'
                }`}
                title="Code Block"
              >
                <Code className="w-5 h-5" />
              </button>
            </div>

            {/* Newspaper Components */}
            <div className="flex items-center gap-2">
              <button
                onClick={addBanner}
                className="p-3 rounded-lg transition-all duration-200 hover:bg-teal-100 dark:hover:bg-teal-900/50 hover:shadow-md text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                title="Add Newspaper Banner"
              >
                <Newspaper className="w-5 h-5" />
              </button>
              <button
                onClick={addNewspaperQuote}
                className="p-3 rounded-lg transition-all duration-200 hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:shadow-md text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                title="Add Newspaper Quote"
              >
                <MessageSquareQuote className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Modals */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onInsertImage={handleInsertImage}
      />
      <ImageModal
        isOpen={imageEditModalOpen}
        onClose={() => {
          setImageEditModalOpen(false)
          setEditingImageData(null)
        }}
        onInsertImage={handleInsertImage}
        editMode={true}
        initialData={editingImageData}
      />
      <LinkModal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        onInsertLink={handleInsertLink}
      />
      <URLEmbedModal
        isOpen={urlEmbedModalOpen}
        onClose={() => setUrlEmbedModalOpen(false)}
        onInsertEmbed={handleInsertURLEmbed}
      />

      <style jsx global>{`
        .ProseMirror {
          font-family: 'Times New Roman', serif !important;
          line-height: 1.8 !important;
          text-align: justify !important;
          padding: 1rem !important;
          background: rgba(255, 255, 255, 0.8) !important;
          border-radius: 0.75rem !important;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05) !important;
          min-height: 400px !important;
        }
        
        .dark .ProseMirror {
          color: #e5e7eb !important;
          background: rgba(17, 24, 39, 0.8) !important;
        }
        
        .ProseMirror h1 {
          font-size: 2.5rem !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 3px solid #f59e0b !important;
          padding-bottom: 0.5rem !important;
          margin-bottom: 1.5rem !important;
        }
        
        .ProseMirror h2 {
          font-size: 2rem !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.03em !important;
          margin-top: 2rem !important;
          margin-bottom: 1rem !important;
        }
        
        .ProseMirror h3 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.75rem !important;
        }
        
        .ProseMirror p {
          margin-bottom: 1rem !important;
          text-align: justify !important;
        }
        
        .ProseMirror p:first-of-type {
          font-size: 1.25rem !important;
          font-weight: 500 !important;
          text-indent: 0 !important;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid #f59e0b !important;
          background: rgba(251, 191, 36, 0.1) !important;
          padding: 1rem 1.5rem !important;
          margin: 1.5rem 0 !important;
          font-style: italic !important;
          border-radius: 0 0.5rem 0.5rem 0 !important;
        }
        
        .ProseMirror ul {
          list-style-type: disc !important;
          margin: 1rem 0 !important;
          padding-left: 2rem !important;
        }
        
        .ProseMirror ol {
          list-style-type: decimal !important;
          margin: 1rem 0 !important;
          padding-left: 2rem !important;
        }
        
        .ProseMirror li {
          display: list-item !important;
          margin-bottom: 0.5rem !important;
          margin-left: 1rem !important;
        }
        
        .ProseMirror code {
          background: rgba(156, 163, 175, 0.2) !important;
          padding: 0.2rem 0.4rem !important;
          border-radius: 0.25rem !important;
          font-family: 'Courier New', monospace !important;
        }
        
        .ProseMirror pre {
          background: #1f2937 !important;
          color: #10b981 !important;
          padding: 1rem !important;
          border-radius: 0.5rem !important;
          overflow-x: auto !important;
          margin: 1.5rem 0 !important;
        }
      `}</style>
    </>
  )
}
