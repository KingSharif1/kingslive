"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import { BannerNode, NewspaperQuote } from './NewspaperExtensions'
import { URLEmbedNode } from './URLEmbedExtension'
import { ResizableImage } from './ResizableImage'
import { useEffect, useState } from 'react'

interface TiptapRendererProps {
  content: string
  className?: string
}

export default function TiptapRenderer({ content, className = "" }: TiptapRendererProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-teal-600 dark:text-teal-400 hover:underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      ResizableImage,
      CodeBlockLowlight.configure({
        lowlight: createLowlight(),
        HTMLAttributes: {
          class: 'bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-xl overflow-x-auto my-4 border border-gray-700',
        },
      }),
      BannerNode,
      NewspaperQuote,
      URLEmbedNode,
    ],
    content: content || '<p>No content available</p>',
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none newspaper-content',
      },
    },
  })

  // Update content when it changes
  useEffect(() => {
    if (editor && mounted && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p>No content available</p>')
    }
  }, [editor, content, mounted])

  // Note: URL embeds are handled by URLEmbedComponent React components
  // No need for manual processing in TiptapRenderer

  // Remove duplicate render logic - the first useEffect handles everything

  if (!mounted || !editor) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 h-96 rounded-xl ${className}`}>
        <div className="p-6 space-y-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`newspaper-content ${className}`}>
      <style jsx global>{`
        .newspaper-content {
          font-family: 'Times New Roman', serif;
          line-height: 1.7;
        }
        
        /* URL Embed Styles */
        .url-embed {
          margin: 1.5rem auto;
        }
        
        .url-embed[data-type="url-embed"] {
          background-color: rgb(255 251 235);
          border: 2px solid rgb(254 215 170);
          border-radius: 0.75rem;
          padding: 1rem;
          transition: all 0.2s;
        }
        
        .url-embed[data-type="url-embed"]:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .dark .url-embed[data-type="url-embed"] {
          background-color: rgba(146, 64, 14, 0.2);
          border-color: rgb(146 64 14);
        }
        
        /* Render full embed data from JSON */
        .url-embed[data-type="url-embed"] {
          position: relative;
          min-height: 120px;
        }
        
        .newspaper-content h1 {
          font-family: 'Times New Roman', serif;
          font-weight: 900;
          font-size: 2.5rem;
          line-height: 1.2;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          // border-bottom: 3px solid currentColor;
          padding-bottom: 0.5rem;
        }
        
        .newspaper-content h2 {
          font-family: 'Times New Roman', serif;
          font-weight: 800;
          font-size: 2rem;
          line-height: 1.3;
          margin-top: 2rem;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        
        .newspaper-content h3 {
          font-family: 'Times New Roman', serif;
          font-weight: 700;
          font-size: 1.5rem;
          line-height: 1.4;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          text-transform: capitalize;
        }
        
        .newspaper-content p {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          text-align: justify;
          text-indent: 1.5rem;
        }
        
        .newspaper-content p:first-of-type {
          font-size: 1.2rem;
          font-weight: 500;
          text-indent: 0;
        }
        
        .newspaper-content blockquote {
          border-left: 4px solid #d97706;
          background: rgba(251, 191, 36, 0.1);
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          font-size: 1.1rem;
        }
        
        .newspaper-content ul, .newspaper-content ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        
        .newspaper-content li {
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }
        
        .newspaper-content strong {
          font-weight: 700;
        }
        
        .newspaper-content em {
          font-style: italic;
        }
        
        .newspaper-content code {
          background: rgba(156, 163, 175, 0.2);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
        }
        
        .newspaper-content pre {
          margin: 1.5rem 0;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        
        .newspaper-content a {
          text-decoration: none;
          // text-decoration-thickness: 2px;
          // text-underline-offset: 2px;
        }
        
        /* Images are handled by React components for consistent styling */
        .newspaper-content img {
          max-width: 100%;
          // height: auto;
          // margin: 1.5rem auto;
          display: block;
          // border-radius: 0.5rem;
          // border: 1px solid #d97706;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }
        
        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .newspaper-content blockquote {
            background: rgba(251, 191, 36, 0.05);
            border-left-color: #f59e0b;
          }
        }
        
        /* Print styles for newspaper look */
        @media print {
          .newspaper-content {
            font-size: 12pt;
            line-height: 1.4;
          }
          
          .newspaper-content h1 {
            font-size: 24pt;
          }
          
          .newspaper-content h2 {
            font-size: 18pt;
          }
          
          .newspaper-content h3 {
            font-size: 14pt;
          }
        }
      `}</style>
      
      <EditorContent editor={editor} />
    </div>
  )
}
