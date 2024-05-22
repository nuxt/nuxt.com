import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface Hosting extends ParsedContent {
  title: string
  description: string
  componentImg: string
  logoImg: string
  logoSrc: string
  category: string
  feature: boolean
}
