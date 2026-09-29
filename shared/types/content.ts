import type { ContentInstanceKey } from '../utils/content'

/**
 * The commit each instance's search artifacts are pinned to, keyed by `ContentInstanceKey`.
 *
 * `null` in dev, where content is read live and there is no commit to pin to.
 */
export type ContentShas = Partial<Record<ContentInstanceKey, string | null>>
