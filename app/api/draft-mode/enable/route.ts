import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { previewClient } from '@/lib/sanity'

export const { GET } = defineEnableDraftMode({
  client: previewClient,
})
