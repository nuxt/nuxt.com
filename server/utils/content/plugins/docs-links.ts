import type { Node } from 'comark'
import { visit } from 'comark/utils'
import type { ContentPlugin } from 'comark-content'
import { docsPathPrefix, type DocVersion } from '../../../../shared/utils/docs'

/** Pages that only exist on `main` (5.x) but are linked as `/docs/4.x/*` from the 5.x docs. */
const V5_ONLY_PAGES = [
  'guide/modules/module-dependencies',
  'guide/best-practices/accessibility',
  'guide/concepts/server-components',
  'guide/recipes/mostly-static-sites'
]

/** A code sample that happens to be a `/docs/*` path is not a link. Same set the core plugins skip. */
const SKIP_TAGS = new Set(['pre', 'code', 'math', 'script', 'style', 'textarea'])

/** Only element nodes carry an attributes bag, so skip text and comment nodes. */
const isRewritable = (node: Node): boolean =>
  Array.isArray(node) && typeof node[0] === 'string' && !SKIP_TAGS.has(node[0])

/**
 * Version the unversioned `/docs/*` links the docs are written with.
 *
 * Rewrites hrefs and MDC props post-parse.
 */
export function docsLinks(version: DocVersion): ContentPlugin {
  const unversioned = /^\/docs\/(?!\d\.x)/
  const prefix = docsPathPrefix(version)

  function versioned(path: string): string {
    let next = path.replace(unversioned, `${prefix}/`)

    // Only the moved pages: a blanket 4.x → 5.x rewrite breaks links to pages 5.x dropped.
    if (version === '5.x') {
      for (const page of V5_ONLY_PAGES) {
        next = next.replace(`${docsPathPrefix('4.x')}/${page}`, `${docsPathPrefix('5.x')}/${page}`)
      }
    }

    return next
  }

  /** Rewrite in place, walking the arrays and objects an MDC prop can hold. */
  function rewriteValues(bag: Record<string, unknown> | unknown[]): void {
    for (const [key, value] of Object.entries(bag)) {
      // `$` is comark's own node metadata (line, html, block), never a link.
      if (key === '$') continue

      if (typeof value === 'string') {
        if (value.startsWith('/docs/')) {
          (bag as Record<string, unknown>)[key] = versioned(value)
        }
      } else if (value && typeof value === 'object') {
        rewriteValues(value as Record<string, unknown> | unknown[])
      }
    }
  }

  return {
    name: 'nuxt-docs-links',
    setup(content) {
      content.hooks.hook('file:parsed', ({ file }) => {
        if (!file) return

        // `visit` walks `nodes` only, so frontmatter takes its own pass.
        if (file.data) rewriteValues(file.data as Record<string, unknown>)

        if (!file.nodes?.length) return

        visit({ nodes: file.nodes, frontmatter: file.data, meta: file.meta }, isRewritable, (node) => {
          // Returning a value would replace the node
          rewriteValues((node as [string, Record<string, unknown>])[1] ?? {})
        })
      })
    }
  }
}
