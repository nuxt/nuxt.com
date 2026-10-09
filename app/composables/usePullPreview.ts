import type { PullTarget } from '#shared/utils/pull'

/**
 * The pull request this page previews (`/pull/:repo/:number `null` outside a preview.
 * Set once per request by `plugins/pull-preview.server.ts`: a preview is only left by a full reload.
 */
export function usePullPreview() {
  return useState<PullTarget | null>('pull-preview', () => null)
}
