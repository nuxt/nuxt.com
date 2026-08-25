import { createMarkdownParser, parseFrontmatter, type Node } from 'comark'
import { visit } from 'comark/utils'
import toc from 'comark/plugins/toc'
import emoji from 'comark/plugins/emoji'
import security from 'comark/plugins/security'
import type { ContentPlugin } from 'comark-content'
import type { DocVersion } from '#shared/utils/docs'

/** Shared by every instance. Bump `CONTENT_PARSER_VERSION` when it changes: cached bodies keep the old output. */
export const comarkPlugins = [
  highlightPlugin,
  toc({ depth: 3 }),
  emoji(),
  security({
    blockedTags: ['script', 'iframe', 'embed', 'form', 'base', 'meta', 'link', 'style'],
    allowDataImages: false
  })
]

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
 * - Rewrites hrefs post-parse: comark has no pre-parse hook, and the tree can't hit code or prose.
 * - 3.x is skipped, as under `@nuxt/content`: its links resolve via the docs-version middleware.
 */
export function docsLinks(version: DocVersion): ContentPlugin {
  return {
    name: 'nuxt-docs-links',
    setup(content) {
      if (version === '3.x') return

      const unversioned = /^\/docs\/(?!\d\.x)/

      content.hooks.hook('file:parsed', ({ file }) => {
        if (!file?.nodes?.length) return

        visit({ nodes: file.nodes, frontmatter: file.data, meta: file.meta }, isLink, (node) => {
          const attrs = (node as [string, Record<string, unknown>])[1]
          const href = attrs?.href
          if (typeof href !== 'string' || !href.startsWith('/docs/')) return

          let next = href.replace(unversioned, `/docs/${version}/`)

          // Only the moved pages: a blanket 4.x → 5.x rewrite breaks links to pages 5.x dropped.
          if (version === '5.x') {
            for (const page of V5_ONLY_PAGES) {
              next = next.replace(`/docs/4.x/${page}`, `/docs/5.x/${page}`)
            }
          }

          if (next !== href) attrs.href = next
        })
      })
    }
  }
}

/**
 * Inject the rendered schema into the 3.x `nuxt.config` reference.
 *
 * - Pre-parse: the generated markdown has to reach the TOC and the highlighter.
 * - Mirrors the stock `markdown()` parser, which it overrides (last-wins per extension).
 */
export function configDocs(): ContentPlugin {
  return {
    name: 'nuxt-docs-config-schema',
    setup(content) {
      const parse = createMarkdownParser({ tracer: content.perf, plugins: comarkPlugins })

      content.addParser(['.md', '.markdown'], async ({ read, partial }) => {
        let body = await read()
        if (!body) return null

        // Frontmatter-only load: the marker lives in the body.
        if (partial) {
          return { kind: 'document' as const, data: parseFrontmatter(body).data, partial: true }
        }

        if (body.includes(CONFIG_DOCS_MARKER)) {
          try {
            body = body.replace(CONFIG_DOCS_MARKER, await generateConfigDocs())
          } catch (error) {
            // A page missing its section beats a 500 on the whole instance.
            content.logger.warn('config-docs', 'could not generate the nuxt.config reference:', error)
          }
        }

        const parsed = await parse(body)
        return {
          kind: 'document' as const,
          nodes: parsed.nodes,
          data: parsed.frontmatter,
          meta: parsed.meta,
          partial: false
        }
      })
    }
  }
}

/** Per-instance plugins, on top of the shared `markdown()`/`yaml()`/`json()` chain. */
export function instancePlugins(key: ContentInstanceKey): ContentPlugin[] {
  if (key === 'site' || key === 'examples') return []

  const version = key.slice('docs:'.length) as DocVersion

  return [
    docsLinks(version),
    // 3.x is the only version with the marker, and the only one publishing `config.schema.json`.
    ...(version === '3.x' ? [configDocs()] : [])
  ]
}
