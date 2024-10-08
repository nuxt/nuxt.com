import type { ParsedContent } from '@nuxt/content'

export interface BlogArticleAuthor {
  name: string
  avatarUrl: string
  link: string
  twitter: string
}

export interface BlogArticle extends ParsedContent {
  description: string
  date: Date
  image: string
  authors: BlogArticleAuthor[]
  tags: string[]
  category: string
}
