import type { ContentInstanceKey } from '#shared/utils/content'

/**
 * The instance an `/api/content/…` path targets, from its leading segments:
 * - `site/…` (nuxt.com's own content: blog, deploy, landing pages…)
 * - `examples/…` (the examples instance, code examples)
 * - `docs/<version>/…` (one instance per docs version)
 */
export function instanceFromSegments(segments: string[]): ContentInstanceKey {
  const [first, second] = segments

  if (first === 'site' || first === 'examples') {
    return first
  }
  if (first === 'docs' && second && isDocVersion(second)) {
    return docsInstanceKey(second)
  }

  throw createError({ statusCode: 404, statusMessage: 'Unknown content instance' })
}
