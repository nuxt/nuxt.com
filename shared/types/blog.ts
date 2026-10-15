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
  authors?: BlogAuthorFrontmatter[]
  [key: string]: unknown
}

/**
 * An author as written in the frontmatter: the GitHub `username` is the identity, it gives the avatar and
 * the link to the Nuxter profile. `to` overrides the link (an author with no contributions has no profile).
 * Posts written before `username` set `avatar` and `to` instead.
 */
export interface BlogAuthorFrontmatter {
  username?: string
  name?: string
  to?: string
  avatar?: { src: string, alt?: string }
  twitter?: string
  bluesky?: string
}

/** An author ready to display: `UUser` and `UBlogPost` props, plus the handles for sharing. */
export interface BlogAuthor {
  name: string
  username?: string
  avatar?: { src: string, alt: string }
  to?: string
  twitter?: string
  bluesky?: string
}
