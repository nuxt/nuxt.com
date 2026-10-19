import type { BlogAuthor, BlogAuthorFrontmatter } from '../types/blog'

const USERNAME_RE = /^[a-z0-9-]{1,39}$/i

/** The authors of a post, ready to display. Entries without a name or a valid username are skipped. */
export function blogAuthors(authors: BlogAuthorFrontmatter[] | undefined): BlogAuthor[] {
  return (authors ?? []).flatMap((author) => {
    const username = author.username && USERNAME_RE.test(author.username) ? author.username : undefined
    const name = author.name?.trim() || username
    if (!name) return []
    // UAvatar renders with <NuxtImg> (IPX): the avatar proxy path, as on the Nuxters pages.
    const src = username ? `/gh_avatar/${username}` : author.avatar?.src
    return [{
      name,
      username,
      avatar: src ? { src, alt: `${name} avatar` } : undefined,
      to: author.to ?? (username ? `/nuxters/${username}` : undefined),
      twitter: author.twitter,
      bluesky: author.bluesky
    }]
  })
}

/** Whether `username` (case-insensitive) wrote the post. */
export function isBlogPostBy(authors: BlogAuthorFrontmatter[] | undefined, username: string): boolean {
  const login = username.toLowerCase()
  return (authors ?? []).some(author => author.username?.toLowerCase() === login)
}
