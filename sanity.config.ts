'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'

import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'

const plugins = [
  structureTool({structure}),
  presentationTool({
    title: 'Preview',
    previewUrl: {
      previewMode: {
        enable: '/api/draft-mode/enable',
      },
    },
    resolve: {
      locations: {
        post: {
          select: {title: 'title', slug: 'slug.current'},
          resolve: (doc) =>
            doc?.slug
              ? {
                  locations: [{title: doc.title || 'Post', href: `/blog/${doc.slug}`}],
                }
              : {message: 'Add a slug to preview this note'},
        },
      },
    },
  }),
]
if (process.env.NODE_ENV === 'development') {
  plugins.push(visionTool({defaultApiVersion: apiVersion}))
}

export default defineConfig({
  basePath: '/studio',
  name: 'kingslive',
  title: 'KingsLive',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins,
})
