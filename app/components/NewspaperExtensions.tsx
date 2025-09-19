"use client"

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import React, { useState, useEffect } from 'react'
import { NodeViewWrapper } from '@tiptap/react'
import { Newspaper, AlertTriangle, Info, Star, Zap, Crown, Anchor } from 'lucide-react'

// Declare lord-icon as a custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': {
        src?: string;
        trigger?: string;
        style?: React.CSSProperties;
        colors?: string;
      };
    }
  }
}

// Banner Node Component
const BannerComponent = ({ node, updateAttributes, selected, editor }: any) => {
  const [isEditing, setIsEditing] = useState(false)
  const isEditable = editor?.isEditable ?? true
  
  const { title, subtitle, iconName, color } = node.attrs

  // No external script loading needed

  const iconMap = {
    // News Coo Chronicles Blog Structure Icons - Flaticon Animated GIFs
    captains_log: 'https://cdn-icons-gif.flaticon.com/13890/13890901.gif',
    treasure_map: 'https://cdn-icons-gif.flaticon.com/19013/19013922.gif',
    marine_intelligence: 'https://cdn-icons-gif.flaticon.com/15557/15557320.gif',
    bounty_hunt: 'https://cdn-icons-gif.flaticon.com/13932/13932790.gif',
    crew_spotlights: 'https://cdn-icons-gif.flaticon.com/11186/11186871.gif',
    devil_fruit_powers: 'https://cdn-icons-gif.flaticon.com/11186/11186848.gif',
    news_coo_delivery: 'https://cdn-icons-gif.flaticon.com/11188/11188599.gif',
    default: 'https://cdn-icons-gif.flaticon.com/13890/13890901.gif'
  }

  const colorMap = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-300 dark:border-blue-700',
      text: 'text-blue-900 dark:text-blue-100',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-300 dark:border-red-700',
      text: 'text-red-900 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-400'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      border: 'border-yellow-300 dark:border-yellow-700',
      text: 'text-yellow-900 dark:text-yellow-100',
      icon: 'text-yellow-600 dark:text-yellow-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-300 dark:border-green-700',
      text: 'text-green-900 dark:text-green-100',
      icon: 'text-green-600 dark:text-green-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-300 dark:border-purple-700',
      text: 'text-purple-900 dark:text-purple-100',
      icon: 'text-purple-600 dark:text-purple-400'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-300 dark:border-amber-700',
      text: 'text-amber-900 dark:text-amber-100',
      icon: 'text-amber-600 dark:text-amber-400'
    }
  }

  const iconUrl = iconMap[iconName as keyof typeof iconMap] || iconMap.default
  const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue

  return (
    <NodeViewWrapper className="my-6">
      <div className={`
        ${colors.bg} ${colors.border} ${colors.text}
        border-2 rounded-xl p-6 shadow-lg
        newspaper-banner relative overflow-hidden
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}>
        {/* Newspaper-style decorative border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
        
        <div className="flex items-start space-x-4">
          <div className={`${colors.icon} flex-shrink-0 mt-1`}>
            <div className="w-28 h-28 rounded-full bg-white dark:bg-gray-800/90 shadow-lg border-2 border-slate-900 flex items-center justify-center">
              <img 
                src={iconUrl} 
                alt="News Coo Icon" 
                className="w-24 h-24 rounded-full"
              />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing && isEditable ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => updateAttributes({ title: e.target.value })}
                  className="w-full text-xl font-bold bg-transparent border-b-2 border-current/30 focus:border-current focus:outline-none"
                  placeholder="Banner Title"
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                  autoFocus
                />
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => updateAttributes({ subtitle: e.target.value })}
                  className="w-full text-base bg-transparent border-b border-current/20 focus:border-current focus:outline-none"
                  placeholder="Subtitle (optional)"
                />
                <div className="flex space-x-2">
                  <select
                    value={iconName}
                    onChange={(e) => updateAttributes({ iconName: e.target.value })}
                    className="px-2 py-1 text-sm bg-white/20 border border-current/30 rounded"
                  >
                    <option value="captains_log">⚓ Captain's Log</option>
                    <option value="treasure_map">🗺️ Treasure Map</option>
                    <option value="marine_intelligence">🌊 Marine Intelligence</option>
                    <option value="bounty_hunt">💰 Bounty Hunt</option>
                    <option value="crew_spotlights">🏝️ Crew Spotlights</option>
                    <option value="devil_fruit_powers">📜 Devil Fruit Powers</option>
                    <option value="news_coo_delivery">🦜 News Coo Delivery</option>
                  </select>
                  <select
                    value={color}
                    onChange={(e) => updateAttributes({ color: e.target.value })}
                    className="px-2 py-1 text-sm bg-white/20 border border-current/30 rounded"
                  >
                    <option value="blue">Blue</option>
                    <option value="red">Red</option>
                    <option value="yellow">Yellow</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="amber">Amber</option>
                  </select>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-sm bg-current/20 hover:bg-current/30 rounded transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => isEditable && setIsEditing(true)} 
                className={isEditable ? "cursor-pointer" : ""}
              >
                <h1 className="text-3xl font-bold mb-2 font-serif uppercase tracking-wide">
                  {title || (isEditable ? 'Click to edit title' : 'Untitled Banner')}
                </h1>
                {subtitle && (
                  <p className="text-base opacity-90 font-medium">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Newspaper-style corner decorations */}
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-current/20"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-current/20"></div>
      </div>
    </NodeViewWrapper>
  )
}

// Banner Node Definition
export const BannerNode = Node.create({
  name: 'banner',
  group: 'block',
  content: 'inline*',
  
  addAttributes() {
    return {
      title: {
        default: 'Section Title',
      },
      subtitle: {
        default: '',
      },
      iconName: {
        default: 'introduction',
      },
      color: {
        default: 'blue',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="banner"]',
        getAttrs: (dom: any) => ({
          title: dom.getAttribute('data-title') || 'Section Title',
          subtitle: dom.getAttribute('data-subtitle') || '',
          iconName: dom.getAttribute('data-icon-name') || 'introduction',
          color: dom.getAttribute('data-color') || 'blue',
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'banner' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(BannerComponent)
  },

  addCommands() {
    return {
      setBanner: (attributes: any) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        })
      },
    } as any
  },
})

// Quote Block for newspaper-style quotes
const QuoteComponent = ({ node, updateAttributes, selected }: any) => {
  const { author, source, text } = node.attrs

  return (
    <NodeViewWrapper className="my-6">
      <div className={`
        bg-amber-50/90 dark:bg-amber-950/30 
        border-l-4 border-amber-500 dark:border-amber-400
        p-6 rounded-r-xl shadow-lg
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}>
        <div className="relative">
          {/* Quote marks */}
          <div className="absolute -top-2 -left-2 text-4xl text-amber-500/30 font-serif">"</div>
          
          <div className="prose prose-lg dark:prose-invert max-w-none pl-6">
            <p className="text-lg italic text-gray-800 dark:text-gray-200 leading-relaxed">
              {text || 'Click to edit quote...'}
            </p>
          </div>
          
          {(author || source) && (
            <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
              <div className="text-right text-sm text-amber-700 dark:text-amber-300 font-medium">
                {author && <span>— {author}</span>}
                {source && <span className="block text-xs opacity-75">{source}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const NewspaperQuote = Node.create({
  name: 'newspaperQuote',
  group: 'block',
  content: 'inline*',
  
  addAttributes() {
    return {
      text: {
        default: 'Enter your quote here...',
      },
      author: {
        default: '',
      },
      source: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'blockquote[data-type="newspaper-quote"]',
        getAttrs: (dom: any) => ({
          text: dom.getAttribute('data-text') || 'Enter your quote here...',
          author: dom.getAttribute('data-author') || '',
          source: dom.getAttribute('data-source') || '',
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['blockquote', mergeAttributes(HTMLAttributes, { 'data-type': 'newspaper-quote' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuoteComponent)
  },

  addCommands() {
    return {
      setNewspaperQuote: (attributes: any) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        })
      },
    } as any
  },
})
