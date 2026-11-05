import type { PullHead } from '#shared/types'

/**
 * The instance a pull request preview replaces, and the commit its search index is pinned to.
 */
export default defineEventHandler(async (event): Promise<PullHead> => {
  const { instanceKey, sha } = await resolvePullPreview(pullTargetFromEvent(event))

  return { instanceKey, sha }
})
