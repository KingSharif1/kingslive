import {createElement} from 'react'
import {defineType, defineArrayMember} from 'sanity'
import {ImagesIcon, ImageIcon, CodeBlockIcon, InlineIcon, ThListIcon, HelpCircleIcon} from '@sanity/icons'
import type {BlockStyleProps} from 'sanity'

/** Inline wrapper so Sanity's default <p> around quote styles stays valid HTML. */
function QuoteStyle(props: BlockStyleProps) {
  return createElement(
    'span',
    {
      style: {
        display: 'block',
        borderLeft: '3px solid currentColor',
        paddingLeft: '0.75rem',
        fontStyle: 'italic',
        opacity: 0.9,
      },
    },
    props.children
  )
}

/**
 * This is the schema type for block content used in the post document type
 * Importing this type into the studio configuration's `schema` property
 * lets you reuse it in other document types with:
 *  {
 *    name: 'someName',
 *    title: 'Some title',
 *    type: 'blockContent'
 *  }
 */

export const blockContentType = defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  options: {
    insertMenu: {
      filter: true,
      showIcons: true,
      groups: [
        {name: 'note', title: 'Note', of: ['photos', 'noteTable', 'faq', 'callout', 'code']},
        {name: 'legacy', title: 'Legacy', of: ['image', 'imageRow']},
      ],
    },
  },
  of: [
    defineArrayMember({
      type: 'block',
      // Styles let you define what blocks can be marked up as. The default
      // set corresponds with HTML tags, but you can set any title or value
      // you want, and decide how you want to deal with it where you want to
      // use your content.
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'H5', value: 'h5'},
        {title: 'H6', value: 'h6'},
        {title: 'Quote', value: 'blockquote', component: QuoteStyle},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      // Marks let you mark up inline text in the Portable Text Editor
      marks: {
        // Decorators usually describe a single property – e.g. a typographic
        // preference or highlighting
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Underline', value: 'underline'},
          {title: 'Strike', value: 'strike-through'},
          {title: 'Code', value: 'code'},
        ],
        // Annotations can be any object structure – e.g. a link or a footnote.
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'photos',
      title: 'Photos',
      icon: ImagesIcon,
      fields: [
        {
          name: 'images',
          title: 'Photos',
          type: 'array',
          description: 'Add one, or up to three. Drag to change order.',
          validation: (Rule) => Rule.min(1).max(3).required(),
          of: [
            {
              type: 'image',
              options: {hotspot: true},
              fields: [
                {name: 'alt', type: 'string', title: 'Alternative text'},
                {name: 'caption', type: 'string', title: 'Caption (optional)'},
              ],
            },
          ],
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption under the set (optional)',
        },
      ],
      preview: {
        select: {media: 'images.0', count: 'images'},
        prepare({media, count}) {
          const n = Array.isArray(count) ? count.length : 0
          return {
            title: n <= 1 ? 'Photo' : `${n} photos`,
            subtitle: n <= 1 ? 'Full width' : 'Side by side',
            media,
          }
        },
      },
    }),
    // Never name this `table` — Studio PTE reserves that for its built-in table plugin.
    defineArrayMember({
      type: 'object',
      name: 'noteTable',
      title: 'Table',
      icon: ThListIcon,
      fields: [
        {
          name: 'col1',
          title: 'Left column header',
          type: 'string',
          initialValue: 'Pin',
        },
        {
          name: 'col2',
          title: 'Right column header',
          type: 'string',
          initialValue: 'Signal',
        },
        {
          name: 'rows',
          title: 'Rows',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'noteTableRow',
              fields: [
                {name: 'a', title: 'Left', type: 'string'},
                {name: 'b', title: 'Right', type: 'string'},
              ],
              preview: {
                select: {a: 'a', b: 'b'},
                prepare({a, b}) {
                  return {title: [a, b].filter(Boolean).join('  ·  ') || 'Empty row'}
                },
              },
            },
          ],
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption (optional)',
        },
      ],
      preview: {
        select: {col1: 'col1', col2: 'col2', rows: 'rows'},
        prepare({col1, col2, rows}) {
          const n = Array.isArray(rows) ? rows.length : 0
          return {
            title: `${col1 || 'Col 1'} / ${col2 || 'Col 2'}`,
            subtitle: n ? `${n} row${n === 1 ? '' : 's'}` : 'Empty table',
          }
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'faq',
      title: 'FAQ',
      icon: HelpCircleIcon,
      fields: [
        {
          name: 'heading',
          title: 'Heading',
          type: 'string',
          initialValue: 'FAQ',
          description: 'Shown above the dropdowns. Clear it to hide.',
        },
        {
          name: 'items',
          title: 'Questions',
          type: 'array',
          validation: (Rule) => Rule.min(1),
          of: [
            {
              type: 'object',
              name: 'faqItem',
              fields: [
                {name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required()},
                {name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: (Rule) => Rule.required()},
              ],
              preview: {
                select: {title: 'question', subtitle: 'answer'},
              },
            },
          ],
        },
      ],
      preview: {
        select: {heading: 'heading', items: 'items'},
        prepare({heading, items}) {
          const n = Array.isArray(items) ? items.length : 0
          return {
            title: heading || 'FAQ',
            subtitle: n ? `${n} question${n === 1 ? '' : 's'}` : 'Empty',
          }
        },
      },
    }),
    // Callout/Note block with rich content
    defineArrayMember({
      type: 'object',
      name: 'callout',
      title: 'Callout',
      icon: InlineIcon,
      fields: [
        {
          name: 'type',
          title: 'Type',
          type: 'string',
          options: {
            list: [
              {title: '💡 Tip', value: 'tip'},
              {title: '⚠️ Warning', value: 'warning'},
              {title: 'ℹ️ Info', value: 'info'},
              {title: '🚀 Pro Tip', value: 'pro'},
            ],
          },
          initialValue: 'info',
        },
        {
          name: 'content',
          title: 'Content',
          type: 'array',
          of: [
            {
              type: 'block',
              styles: [
                {title: 'Normal', value: 'normal'},
                {title: 'H3', value: 'h3'},
                {title: 'H4', value: 'h4'},
              ],
              lists: [
                {title: 'Bullet', value: 'bullet'},
                {title: 'Numbered', value: 'number'},
              ],
              marks: {
                decorators: [
                  {title: 'Strong', value: 'strong'},
                  {title: 'Emphasis', value: 'em'},
                  {title: 'Code', value: 'code'},
                ],
                annotations: [
                  {
                    title: 'URL',
                    name: 'link',
                    type: 'object',
                    fields: [
                      {
                        title: 'URL',
                        name: 'href',
                        type: 'url',
                      },
                    ],
                  },
                ],
              },
            },
            {
              type: 'image',
              options: {hotspot: true},
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alt Text',
                },
                {
                  name: 'caption',
                  type: 'string',
                  title: 'Caption',
                },
              ],
            },
          ],
        },
      ],
      preview: {
        select: {
          type: 'type',
        },
        prepare({type}) {
          const icons: Record<string, string> = {
            tip: '💡',
            warning: '⚠️',
            info: 'ℹ️',
            pro: '🚀',
          }
          return {
            title: `${icons[type] || 'ℹ️'} ${type?.charAt(0).toUpperCase() + type?.slice(1) || 'Callout'}`,
            subtitle: 'Rich content callout',
          }
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'code',
      title: 'Code Block',
      icon: CodeBlockIcon,
      fields: [
        {
          name: 'language',
          title: 'Language',
          type: 'string',
          options: {
            list: [
              {title: 'JavaScript', value: 'javascript'},
              {title: 'TypeScript', value: 'typescript'},
              {title: 'HTML', value: 'html'},
              {title: 'CSS', value: 'css'},
              {title: 'Python', value: 'python'},
              {title: 'JSON', value: 'json'},
              {title: 'Bash', value: 'bash'},
              {title: 'SQL', value: 'sql'},
              {title: 'JSX', value: 'jsx'},
              {title: 'TSX', value: 'tsx'},
              {title: 'Markdown', value: 'markdown'},
              {title: 'YAML', value: 'yaml'},
              {title: 'GraphQL', value: 'graphql'},
              {title: 'Plain Text', value: 'text'},
            ],
          },
        },
        {
          name: 'code',
          title: 'Code',
          type: 'text',
          options: {
            spellCheck: false,
          },
        },
        {
          name: 'filename',
          title: 'Filename (optional)',
          type: 'string',
          description: 'e.g., index.js, styles.css',
        },
      ],
      preview: {
        select: {
          code: 'code',
          language: 'language',
          filename: 'filename',
        },
        prepare({code, language, filename}) {
          return {
            title: filename || `${language || 'Code'} block`,
            subtitle: code ? code.substring(0, 50) + '...' : 'Empty code block',
          }
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'imageRow',
      title: 'Image row (legacy)',
      icon: ImageIcon,
      deprecated: {reason: 'Use Photos — one, two, or three images in the same block.'},
      fields: [
        {
          name: 'images',
          title: 'Photos',
          type: 'array',
          validation: (Rule) => Rule.min(2).max(3).required(),
          of: [
            {
              type: 'image',
              options: {hotspot: true},
              fields: [
                {name: 'alt', type: 'string', title: 'Alternative text'},
                {name: 'caption', type: 'string', title: 'Caption (optional)'},
              ],
            },
          ],
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Row caption (optional)',
        },
      ],
      preview: {
        select: {media: 'images.0', count: 'images'},
        prepare({media, count}) {
          const n = Array.isArray(count) ? count.length : 0
          return {title: `${n} photos (legacy row)`, media}
        },
      },
    }),
    defineArrayMember({
      type: 'image',
      title: 'Image (legacy)',
      icon: ImageIcon,
      deprecated: {reason: 'Use Photos instead.'},
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
        },
      ],
    }),
  ],
})
