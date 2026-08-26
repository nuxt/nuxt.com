/** The blog frontmatter the app reads, plus the fields carried from the document. */
export interface BlogArticle {
  path: string
  stem: string
  extension?: string
  title: string
  description: string
  date: string
  image?: string
  category?: string
  tags?: string[]
  draft?: boolean
  authors?: Array<{ name: string, to?: string, avatar?: { src: string, alt?: string }, twitter?: string, bluesky?: string }>
  [key: string]: unknown
}
