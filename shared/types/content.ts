import type { ContentInstanceKey } from '../utils/content'

/**
 * The commit each instance's search artifacts are pinned to, keyed by `ContentInstanceKey`.
 *
 * `null` in dev, where content is read live and there is no commit to pin to.
 */
export type ContentShas = Partial<Record<ContentInstanceKey, string | null>>

/** A pull request preview, as its banner shows it (`GET /api/pull/:repo/:number`). */
export interface PullPreviewSummary {
  /** `nuxt/nuxt` */
  repo: string
  number: number
  title: string
  url: string
  /** The head commit the previewed instances are pinned to. */
  sha: string
  /** Pages the PR adds or changes, in GitHub's file order. */
  pages: Array<{ title: string, path: string }>
}
