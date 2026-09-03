import type { Node } from 'comark'
import { visit } from 'comark/utils'
import type { ContentPlugin } from 'comark-content'
import { CLI_DOCS_REFS, CLI_DOCS_REPO } from '#shared/utils/cli'
import type { DocVersion } from '#shared/utils/docs'

const isImage = (node: Node): boolean => Array.isArray(node) && node[0] === 'img'

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
