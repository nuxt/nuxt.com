import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import type { Release } from '#shared/types'

export default defineCachedEventHandler(async () => {
  const rawReleases = await fetchRawReleases() || []

  const releases: Release[] = await Promise.all(
    rawReleases.slice(0, 20).map(async r => ({
      ...r,
      body: (await parseMarkdown(r.markdown)).body
    } satisfies Release))
  )

  return releases
}, {
  name: 'releases',
  swr: true,
  maxAge: 60 * 60
})
