import type { ContentPlugin } from 'comark-content'

/**
 * Pages spread content data into components (`v-bind="fm"`): Vue binds unknown keys to the DOM.
 * Apply comark's `security()` rules on Markdown bodies to every file's data.
 * Mirrors `comark/dist/internal/props-validation.js`
 */

/** Keys that write markup or redirect a form whatever their value: comark's list, plus `outerHTML` and `innerText`. */
const UNSAFE_KEYS = new Set(['innerhtml', 'outerhtml', 'innertext', 'textcontent', 'dangerouslysetinnerhtml', 'srcdoc', 'formaction'])

/** Keys a URL is bound through. */
const URL_KEYS = new Set(['to', 'href', 'src', 'action', 'xlinkhref'])

/** comark's protocol floor. */
const UNSAFE_URL_PREFIXES = ['javascript:', 'vbscript:', 'data:text/html', 'data:text/javascript', 'data:text/vbscript', 'data:text/css', 'data:text/plain', 'data:text/xml']

/** Tags comark strips the props of, blocked or not. */
const UNSAFE_TAGS = ['object']

function isUnsafeUrl(value: string): boolean {
  // Vue binds values verbatim, so no entity decoding; `new URL()` drops the tabs and spaces browsers ignore.
  try {
    const href = new URL(value).href.toLowerCase()
    return UNSAFE_URL_PREFIXES.some(prefix => href.startsWith(prefix))
  } catch {
    // Relative: no protocol to abuse.
    return false
  }
}

function isUnsafeEntry(key: string, value: unknown, blockedTags: Set<string>): boolean {
  const name = key.toLowerCase().replace(/:/g, '')
  if (name.startsWith('on') || UNSAFE_KEYS.has(name)) return true
  if (typeof value !== 'string') return false
  if (URL_KEYS.has(name)) return isUnsafeUrl(value)

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

    for (const [key, child] of Object.entries(value)) {
      const at = path ? `${path}.${key}` : key
      if (isUnsafeEntry(key, child, blocked)) {
        Reflect.deleteProperty(value, key)
        removed.push(at)
      } else {
        walk(child, at)
      }
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
