import type { SitePage } from '~/utils/content'

export type BlogArticle = SitePage<{
  title: string
  description: string
  date: string
  image?: string
  category?: string
  draft?: boolean
  authors: Array<{
    name: string
    to?: string
    twitter?: string
    bluesky?: string
    avatar?: { src: string; alt?: string }
  }>
}>
