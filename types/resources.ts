import type { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface ResourcesBlogArticleAuthor {
  name: string
  avatarUrl: string
  link: string
}

export interface ResourcesBlogArticle extends ParsedContent {
  description: string
  date: Date
  imgUrl: string
  authors: ResourcesBlogArticleAuthor[]
  tags: string[]
  category: string
}

export interface ResourcesCaseStudy extends ParsedContent {
  description: string
  url: string
  imgUrl: string
  gradientUrl: string
}

export interface ResourcesLiveEvent extends ParsedContent {
  videoId: string
  date: string
  eventLogo: string
  avatarSrc: string
  name: string
  speaker: string
  description: string
}

export interface ResourcesShowcasesListGroupItem {
  createdAt: string
  description: string
  domain: string
  favicon: string
  framework: { id: number, slug: string, name: string, url: string, imgPath: string, updatedAt: string, createdAt: string }
  frameworkVersion: string
  hasSSR: boolean
  hostname: string
  id: number
  isFeatured: boolean
  isStatic: boolean
  language: string
  lastDetectedAt: string
  list_group_id: number
  position: number
  rank: string
  screenshotUrl: string
  showcase_id: number
  siteName: string
  slug: string
  title: string
  ui: string
  uiVersion: string
  updatedAt: string
  url: string
  vueVersion: string
}

export interface ResourcesShowcasesListGroup {
  created_at: string
  id: number
  name: string
  position: number
  showcases: ResourcesShowcasesListGroupItem[]
  updated_at: string
}

export interface ResourcesShowcasesList {
  created_at: string
  groups: ResourcesShowcasesListGroup[]
  id: number
  name: string
  updated_at: string
}
