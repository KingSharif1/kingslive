import {defineType, defineArrayMember} from 'sanity'
import {ImageIcon, CodeBlockIcon, InlineIcon} from '@sanity/icons'

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
        {title: 'Quote', value: 'blockquote'},
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
    // Code Block with syntax highlighting
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
    // Image with caption
    defineArrayMember({
      type: 'image',
      icon: ImageIcon,
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessibility',
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
          description: 'Optional caption to display below the image',
        },
      ],
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
  ],
})
