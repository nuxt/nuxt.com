import { sanitizeData as sanitizeWithComark, type SanitizeDataOptions } from 'comark/utils'
import type { ContentPlugin } from 'comark-content'

/**
 * comark's `security()` sanitizes frontmatter on a full Markdown parse only. It misses:
 * - YAML and JSON files, which never go through comark
 * - partial loads (listings, navigation), which read frontmatter without comark's plugins
 * - keys plugins rewrite after comark: `dottedFrontmatter()` turns `hero.^onclick` into `hero: { '^onclick' }`
 */

const UNSAFE_PROTOCOLS = new Set(['javascript:', 'vbscript:', 'data:'])

function isUnsafeUrl(value: string): boolean {
  if (!value.includes(':')) return false

  try {
    return UNSAFE_PROTOCOLS.has(new URL(value).protocol)
  } catch {
    // Relative: no protocol to abuse.
    return false
  }
}

/**
 * Delete script URLs under any key from `data` in place, returning the dotted paths it removed.
 * comark only checks URL keys (`to`, `*url`, `*link`…), but templates bind others as links: `template.demo`, `providerData.website`.
 * The price: prose opening with `javascript:` goes too.
 */
function stripUnsafeUrls(data: unknown): string[] {
  const removed: string[] = []
  // YAML aliases can share or nest an object.
  const seen = new WeakSet<object>()

  const walk = (value: unknown, path: string) => {
    if (value === null || typeof value !== 'object' || seen.has(value)) return
    seen.add(value)

    let deleted = false
    for (const [key, child] of Object.entries(value)) {
      const at = path ? `${path}.${key}` : key
      if (typeof child === 'string' && isUnsafeUrl(child)) {
        Reflect.deleteProperty(value, key)
        removed.push(at)
        deleted = true
      } else {
        walk(child, at)
      }
    }

    // A deleted item leaves a hole, which serialises as `null` and breaks `v-for` templates.
    if (deleted && Array.isArray(value)) {
      value.splice(0, value.length, ...value.filter(() => true))
    }
  }
  walk(data, '')

  return removed
}

/**
 * Delete unsafe entries from `data` in place: comark's rules, then script URLs under any key.
 * Returns the dotted paths it removed.
 */
export function stripUnsafeData(data: unknown, options: SanitizeDataOptions): string[] {
  return [...sanitizeWithComark(data, options), ...stripUnsafeUrls(data)]
}

/**
 * Strip unsafe entries from every file's data.
 * Register it last: `file:parsed` hooks run in order, so it sees what the other plugins produced.
 */
export function sanitizeData(options: SanitizeDataOptions): ContentPlugin {
  return {
    name: 'nuxt-sanitize-data',
    setup(content) {
      content.hooks.hook('file:parsed', ({ file }) => {
        if (!file) return

        const removed = stripUnsafeData(file.data, options)
        if (import.meta.dev && removed.length) {
          content.logger.warn('sanitize-data', `${file.meta.key}: removed unsafe ${removed.map(path => `\`${path}\``).join(', ')}`)
        }
      })
    }
  }
}
