import {DocumentTextIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary shown on the blog index and homepage. Auto-generated from the body if empty.',
    }),
    defineField({
      name: 'author',
      type: 'reference',
      to: {type: 'author'},
    }),
    defineField({
      name: 'mainImage',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
        }),
      ],
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: {type: 'category'}})],
    }),
    defineField({
      name: 'relatedProjectId',
      title: 'Related project',
      type: 'string',
      description: 'Links this post to a portfolio project (and vice versa on the site).',
      options: {
        list: [
          { title: 'HireIQ', value: 'hireiq' },
          { title: 'DfwNemt', value: 'dfwnemt' },
          { title: 'RideNEMT', value: 'ridenemt' },
          { title: 'Roomba Dashboard', value: 'roomba-dashboard' },
          { title: 'Nami', value: 'nami' },
          { title: 'AI Receptionist', value: 'ai-receptionist' },
          { title: 'KudsiWebsite', value: 'kudsi' },
          { title: '1942: Truly Forgotten', value: '1942' },
          { title: 'AM African Market', value: 'am-african-market' },
        ],
        layout: 'dropdown',
      },
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: true,
      description: 'Uncheck to hide from the public blog.',
    }),
    defineField({
      name: 'body',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
      published: 'published',
    },
    prepare(selection) {
      const {author, published} = selection
      const status = published === false ? 'Draft' : 'Published'
      return {
        ...selection,
        subtitle: [status, author && `by ${author}`].filter(Boolean).join(' · '),
      }
    },
  },
})
