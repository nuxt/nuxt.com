import type { ContentInstanceKey } from '#shared/utils/content'

// TODO: use comark types
export interface ContentPage {
  title: string
  path: string
  description: string
  /** The page's frontmatter — blog posts and deploy guides carry fields their consumers read. */
  data: Record<string, unknown>
}

/**
 * Every markdown page of an instance, optionally limited to one directory.
 */
export async function listInstancePages(
  key: ContentInstanceKey,
  opts: { dir?: string } = {}
): Promise<ContentPage[]> {
  const content = await getInstance(key)
  const items = await content.list()
  const prefix = opts.dir ? `${opts.dir}/` : undefined

  return items
    .filter(item => item.meta.extension === '.md'
      && !isDotFile(item.meta.stem)
      && (!prefix || item.path.startsWith(prefix)))
    .map((item) => {
      const data = (item.data ?? {}) as Record<string, unknown>
      return {
        title: (data.title as string) ?? item.path,
        path: item.path,
        description: (data.description as string) ?? '',
        data
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))
}

function isDotFile(stem: string): boolean {
  return stem.split('/').pop()!.startsWith('.')
}
