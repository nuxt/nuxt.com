import type { ContentListFile } from 'comark-content'

export interface BlogArticleData {
  title: string
  description: string
  date: string
  image?: string
  category?: string
  draft?: boolean
  seo?: {
    title?: string
    description?: string
  }
  authors: Array<{
    name: string
    to?: string
    twitter?: string
    bluesky?: string
    avatar?: { src: string, alt?: string }
  }>
}

export type BlogArticle = ContentListFile<BlogArticleData>
