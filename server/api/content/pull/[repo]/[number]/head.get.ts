import type { PullHead } from '#shared/types'
import { defineHandler } from 'nuxt/server'

/**
 * The instance a pull request preview replaces, and the commit its search index is pinned to.
 */
export default defineHandler(async (event): Promise<PullHead> => {
  const { instanceKey, sha } = await resolvePullPreview(pullTargetFromEvent(event))

  return { instanceKey, sha }
})
