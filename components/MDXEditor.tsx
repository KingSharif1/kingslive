"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import MDXEditor to avoid SSR issues
const MDXEditorComponent = dynamic(
  () => import('@mdxeditor/editor').then((mod) => {
    return mod.MDXEditor
  }),
  { ssr: false }
)

// Dynamically import plugins
const DiffSourceTogglePlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.diffSourcePlugin),
  { ssr: false }
)

const HeadingsPlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.headingsPlugin),
  { ssr: false }
)

const ListsPlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.listsPlugin),
  { ssr: false }
)

const LinkPlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.linkPlugin),
  { ssr: false }
)

const QuotePlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.quotePlugin),
  { ssr: false }
)

const ThematicBreakPlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.thematicBreakPlugin),
  { ssr: false }
)

const CodeBlockPlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.codeBlockPlugin),
  { ssr: false }
)

const ImagePlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.imagePlugin),
  { ssr: false }
)

const TablePlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.tablePlugin),
  { ssr: false }
)

const MarkdownShortcutPlugin = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.markdownShortcutPlugin),
  { ssr: false }
)

interface MDXEditorProps {
  markdown: string
  onChange: (markdown: string) => void
}

export function MDXEditorWrapper({ markdown, onChange }: MDXEditorProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="border rounded-lg p-4 min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    )
  }

  return (
    <div className="mdx-editor-wrapper border rounded-lg overflow-hidden">
      <MDXEditorComponent
        markdown={markdown}
        onChange={onChange}
        plugins={[
          HeadingsPlugin(),
          ListsPlugin(),
          LinkPlugin(),
          QuotePlugin(),
          ThematicBreakPlugin(),
          CodeBlockPlugin(),
          ImagePlugin(),
          TablePlugin(),
          MarkdownShortcutPlugin(),
          DiffSourceTogglePlugin()
        ]}
        className="min-h-[400px] p-4"
      />
    </div>
  )
}

// MDX Preview component
export function MDXPreview({ content }: { content: string }) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    // This is a simplified version - in production, you'd use next-mdx-remote
    const importMDX = async () => {
      try {
        const { compile } = await import('next-mdx-remote/rsc')
        const MDXContent = await compile(content)
        setComponent(() => () => MDXContent)
      } catch (error) {
        console.error('Error compiling MDX:', error)
      }
    }

    importMDX()
  }, [content])

  if (!Component) {
    return <div>Loading preview...</div>
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <Component />
    </div>
  )
}
