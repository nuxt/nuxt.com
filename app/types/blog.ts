export interface BlogArticle {
  path: string
  title: string
  description: string
  image?: string
  date: string
  category: 'Release' | 'Tutorial' | 'Announcement' | 'Article'
  tags?: string[]
  draft?: boolean
  seo?: {
    title?: string
    description?: string
  }
  authors: {
    name: string
    avatar?: { src: string }
    to?: string
    twitter?: string
    bluesky?: string
  }[]
}
