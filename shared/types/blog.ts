export type BlogCategory = 'Release' | 'Engineering' | 'Ecosystem' | 'Announcement'

/** The blog frontmatter the app reads, plus the fields carried from the document. */
export interface BlogArticle {
  path: string
  stem: string
  extension?: string
  title: string
  description: string
  date: string
  image?: string
  category?: BlogCategory
  tags?: string[]
  draft?: boolean
  authors?: Array<{ name: string, to?: string, avatar?: { src: string, alt?: string }, twitter?: string, bluesky?: string }>
  seo?: { title?: string, description?: string }
  [key: string]: unknown
}

/** A section of a blog post in the search index, split on `h2` and `h3` headings. */
export interface BlogSearchSection {
  title?: string
  id?: string
  /** Prose of the section */
  text: string
  /** Code blocks of the section, kept apart so snippets prefer prose */
  code: string
}

export interface BlogSearchDocument {
  path: string
  title: string
  description: string
  authors: string
  sections: BlogSearchSection[]
}

export interface BlogSearchResult {
  /** Blog post path, e.g. `/blog/v4-6` */
  path: string
  /** The section that matches best, when the match isn't in the title or description */
  section?: { title: string, id: string }
  snippet: string
  /** The snippet comes from a code block, because the terms only appear in code */
  code?: boolean
}
