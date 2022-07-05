import { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface ResourcesBlogArticleAuthor {
  name: string
  avatarUrl: string
  link: string
}

export interface ResourcesBlogArticle extends ParsedContent {
  template: string
  title: string
  description: string
  imgUrl: string
  imgCredits: string
  imgCreditsUrl: string
  date: Date
  authors: ResourcesBlogArticleAuthor[]
  tags: string[]
  category: string
  type: string
}
