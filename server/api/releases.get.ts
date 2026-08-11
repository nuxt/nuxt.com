import type { Release } from '#shared/types'
import { parseMarkdown } from '../utils/markdown'

export default defineCachedEventHandler(async () => {
  const rawReleases = await fetchRawReleases() || []

  const releases: Release[] = await Promise.all(
    rawReleases.slice(0, 20).map(async r => ({
      ...r,
      body: await parseMarkdown(r.markdown)
    } satisfies Release))
  )

  return releases
}, {
  // v3: `body` is now a full parsed MarkdownDocument (nodes + frontmatter + meta)
  name: 'releases:v3',
  swr: true,
  maxAge: 60 * 60
})
