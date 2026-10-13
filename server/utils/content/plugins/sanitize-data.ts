import type { ContentPlugin } from 'comark-content'

/**
 * Pages spread content data into components (`v-bind="fm"`): Vue binds unknown keys to the DOM.
 * Apply comark's `security()` rules on Markdown bodies to every file's data.
 * Mirrors `comark/dist/internal/props-validation.js`
 */

/** Keys that write text or a document, or redirect a form, whatever their value: comark's list, plus `innerText`. */
const UNSAFE_KEYS = new Set(['innertext', 'textcontent', 'srcdoc', 'formaction'])

const UNSAFE_PROTOCOLS = new Set(['javascript:', 'vbscript:', 'data:'])

/** Tags comark strips the props of, blocked or not. */
const UNSAFE_TAGS = ['object']

function isUnsafeUrl(value: string): boolean {
  if (!value.includes(':')) return false

  try {
    return UNSAFE_PROTOCOLS.has(new URL(value).protocol)
  } catch {
    // Relative: no protocol to abuse.
    return false
  }
}

function isUnsafeEntry(key: string, value: unknown, blockedTags: Set<string>): boolean {
  // Vue binds a leading `.` as a DOM prop and `^` as an attribute: `^onclick` is `onclick`.
  const name = key.toLowerCase().replace(/^[.^]+/, '').replace(/:/g, '')
  if (name.startsWith('on') || name.endsWith('html') || UNSAFE_KEYS.has(name)) return true
  if (typeof value !== 'string') return false
  if (isUnsafeUrl(value)) return true

  // `as` picks the element a component renders.
  return name === 'as' && blockedTags.has(value.toLowerCase())
}

/**
 * Delete unsafe keys from `data` in place, at any depth.
 * Returns the dotted paths it removed.
 */
export function stripUnsafeData(data: unknown, blockedTags: string[]): string[] {
  const blocked = new Set([...blockedTags, ...UNSAFE_TAGS].map(tag => tag.toLowerCase()))
  const removed: string[] = []
  // YAML aliases can share or nest an object.
  const seen = new WeakSet<object>()

  const walk = (value: unknown, path: string) => {
    if (value === null || typeof value !== 'object' || seen.has(value)) return
    seen.add(value)

    let deleted = false
    for (const [key, child] of Object.entries(value)) {
      const at = path ? `${path}.${key}` : key
      if (isUnsafeEntry(key, child, blocked)) {
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
 * Strip markup, event handler and script URL keys from every file's data.
 * Register it last: `file:parsed` hooks run in order, so it sees what the other plugins produced.
 */
export function sanitizeData(options: { blockedTags: string[] }): ContentPlugin {
  return {
    name: 'nuxt-sanitize-data',
    setup(content) {
      content.hooks.hook('file:parsed', ({ file }) => {
        if (!file) return

        const removed = stripUnsafeData(file.data, options.blockedTags)
        if (removed.length) {
          content.logger.warn('sanitize-data', `${file.meta.key}: removed unsafe ${removed.map(path => `\`${path}\``).join(', ')}`)
        }
      })
    }
  }
}
