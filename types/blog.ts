import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface BlogArticleAuthor {
  name: string
  avatarUrl: string
  link: string
}

export interface BlogArticle extends ParsedContent {
  description: string
  date: Date
  image: string
  authors: BlogArticleAuthor[]
  tags: string[]
  category: string
}
