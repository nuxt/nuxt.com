import type { Release } from '#shared/types'
import { parseMarkdown } from '../utils/markdown'

export default defineCachedEventHandler(async () => {
  const rawReleases = await fetchRawReleases() || []

  const releases: Release[] = await Promise.all(
    rawReleases.slice(0, 20).map(async r => ({
      ...r,
      body: (await parseMarkdown(r.markdown)).nodes
    } satisfies Release))
  )

  return releases
}, {
  name: 'releases:v2',
  swr: true,
  maxAge: 60 * 60
})
