import type { ContentPlugin } from 'comark-content'

/**
Replace https://github.com/comarkdown/comark-content/pull/121 that has been rejected:
Comark must stick with yaml standard.
 */
export const DOTTED_NAV_FIELDS = ['navigation.icon', 'navigation.title']

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Expand dotted keys into nested objects (`{ 'a.b': 1 }` -> `{ a: { b: 1 } }`).
 */
export function unflattenDotted(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (!key.includes('.')) out[key] = value
  }

  for (const [key, value] of Object.entries(data)) {
    if (!key.includes('.')) continue

    const parts = key.split('.')
    const leaf = parts.at(-1)!
    let node = out
    let dropped = false

    for (const part of parts.slice(0, -1)) {
      const current = node[part]
      if (current !== undefined && (current === null || typeof current !== 'object' || Array.isArray(current))) {
        dropped = true
        break
      }
      node = (node[part] ??= {}) as Record<string, unknown>
    }

    if (!dropped && !(leaf in node)) node[leaf] = value
  }

  return out
}

/**
 * `.navigation.yml` is already nav config:
 * hoist `navigation.icon` to `icon` so it isn't nested under `navigation`
 */
export function hoistNavigationPrefix(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('navigation.')) out[key] = value
  }
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('navigation.')) continue
    const leaf = key.slice('navigation.'.length)
    if (!(leaf in out)) out[leaf] = value
  }

  return out
}

/** Expand `navigation.icon` / `navigation.title` frontmatter shorthand. See `DOTTED_NAV_FIELDS`. */
export function dottedFrontmatter(): ContentPlugin {
  return {
    name: 'nuxt-dotted-frontmatter',
    setup(content) {
      // `pick()` runs before `file:parsed` on partial parses — list the dotted keys so they survive.
      content.addListingFields(['.md', '.markdown', '.yml', '.yaml'], DOTTED_NAV_FIELDS)

      content.hooks.hook('file:parsed', ({ file }) => {
        if (!file || !isPlainObject(file.data)) return

        const isNavigationConfig = file.meta.stem.split('/').pop() === '.navigation'
        file.data = unflattenDotted(isNavigationConfig ? hoistNavigationPrefix(file.data) : file.data)
      })
    }
  }
}
