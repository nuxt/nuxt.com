import type { PullPreviewSummary } from '#shared/types'
import { pullRepoName } from '#shared/utils/pull'

/**
 * What a pull request preview's banner shows; a 404 here is the preview's 404.
 */
export default defineEventHandler(async (event): Promise<PullPreviewSummary> => {
  const preview = await resolvePullPreview(pullTargetFromEvent(event))

  return {
    repo: pullRepoName(preview.target.repo),
    number: preview.target.number,
    title: preview.title,
    url: preview.url,
    sha: preview.sha,
    pages: await pullPages(preview)
  }
})
