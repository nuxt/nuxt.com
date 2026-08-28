import { createMarkdownParser, parseFrontmatter, type Node } from 'comark'
import { visit } from 'comark/utils'
import toc from 'comark/plugins/toc'
import emoji from 'comark/plugins/emoji'
import security from 'comark/plugins/security'
import markdownFields from 'comark-content/plugins/markdown-fields'
import type { ContentPlugin } from 'comark-content'
import { CLI_DOCS_REFS, CLI_DOCS_REPO } from '#shared/utils/cli'
import { docsPathPrefix, type DocVersion } from '#shared/utils/docs'

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

const isImage = (node: Node): boolean => Array.isArray(node) && node[0] === 'img'

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

/**
 * Resolve the `nuxt/cli` command reference's image sources.
 */
export function cliDocs(version: DocVersion): ContentPlugin {
  return {
    name: 'nuxt-cli-docs',
    setup(content) {
      const rawBase = `https://raw.githubusercontent.com/${CLI_DOCS_REPO}/${CLI_DOCS_REFS[version].branch}`

      content.hooks.hook('file:parsed', ({ file }) => {
        if (!file?.nodes?.length) return

        visit({ nodes: file.nodes, frontmatter: file.data, meta: file.meta }, isImage, (node) => {
          const attrs = (node as [string, Record<string, unknown>])[1]
          const src = attrs?.src
          // Protocol-relative URLs are absolute, not repo-relative.
          if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//')) return

          attrs.src = rawBase + src
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
  if (key === 'site') return [markdownFields()]
  if (key === 'examples') return []
  if (key.startsWith('cli:')) {
    const version = key.slice('cli:'.length) as DocVersion
    // Command pages are written with the same unversioned `/docs/*` links as the docs.
    return [docsLinks(version), cliDocs(version)]
  }

  const version = key.slice('docs:'.length) as DocVersion

  return [
    docsLinks(version),
    // 3.x is the only version with the marker, and the only one publishing `config.schema.json`.
    ...(version === '3.x' ? [configDocs()] : [])
  ]
}
