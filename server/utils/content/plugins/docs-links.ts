import type { Node } from 'comark'
import { visit } from 'comark/utils'
import type { ContentPlugin } from 'comark-content'
import { docsPathPrefix, type DocVersion } from '#shared/utils/docs'

/** Pages that only exist on `main` (5.x) but are linked as `/docs/4.x/*` from the 5.x docs. */
const V5_ONLY_PAGES = [
  'guide/modules/module-dependencies',
  'guide/best-practices/accessibility',
  'guide/concepts/server-components',
  'guide/recipes/mostly-static-sites'
]

const isLink = (node: Node): boolean => Array.isArray(node) && node[0] === 'a'

/**
 * Version the unversioned `/docs/*` links the docs are written with.
 *
 * Rewrites hrefs post-parse: comark has no pre-parse hook, and the tree can't hit code or prose.
 */
export function docsLinks(version: DocVersion): ContentPlugin {
  return {
    name: 'nuxt-docs-links',
    setup(content) {
      const unversioned = /^\/docs\/(?!\d\.x)/

      content.hooks.hook('file:parsed', ({ file }) => {
        if (!file?.nodes?.length) return

        visit({ nodes: file.nodes, frontmatter: file.data, meta: file.meta }, isLink, (node) => {
          const attrs = (node as [string, Record<string, unknown>])[1]
          const href = attrs?.href
          if (typeof href !== 'string' || !href.startsWith('/docs/')) return

          let next = href.replace(unversioned, `${docsPathPrefix(version)}/`)

          // Only the moved pages: a blanket 4.x → 5.x rewrite breaks links to pages 5.x dropped.
          if (version === '5.x') {
            for (const page of V5_ONLY_PAGES) {
              next = next.replace(`${docsPathPrefix('4.x')}/${page}`, `${docsPathPrefix('5.x')}/${page}`)
            }
          }

          if (next !== href) attrs.href = next
        })
      })
    }
  }
}
