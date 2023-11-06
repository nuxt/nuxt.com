import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface Integration extends ParsedContent {
  title: string
  description: string
  image: string
  category: string
}
