import type { Node } from 'comark'
import { visit } from 'comark/utils'
import type { ContentPlugin } from 'comark-content'

const isImage = (node: Node): boolean => Array.isArray(node) && node[0] === 'img'

/**
 * Resolve root-relative image sources against the repository a source reads
 * (the `nuxt/cli` command reference, a module's docs).
 */
export function repoImages(repo: string, branch: string): ContentPlugin {
  return {
    name: 'repo-images',
    setup(content) {
      const rawBase = `https://raw.githubusercontent.com/${repo}/${branch}`

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
