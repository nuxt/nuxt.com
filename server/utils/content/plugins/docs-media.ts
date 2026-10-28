import type { Node } from 'comark'
import { visit } from 'comark/utils'
import type { ContentPlugin } from 'comark-content'
import { hasProtocol, joinURL } from 'ufo'

const isImage = (node: Node): boolean => Array.isArray(node) && node[0] === 'img'

/**
 * Resolve `./images/tab.png` against the page's directory: the file key of a media item in the source,
 * or `undefined` when the path leaves the source.
 */
function resolveMediaKey(stem: string, src: string): string | undefined {
  const parts = stem.split('/').slice(0, -1)
  for (const part of src.split(/[?#]/)[0]!.split('/')) {
    if (part === '..') {
      if (!parts.length) return
      parts.pop()
    } else if (part && part !== '.') parts.push(part)
  }

  return parts.join('/') || undefined
}

/**
 * Point relative image sources (`./images/tab.png`, as GitHub renders them too) at the media item
 * they name, served under the source's prefix: `/modules/devtools/images/tab.png`.
 * `server/middleware/docs-media.ts` serves it from the instance, at the commit the page was read from.
 *
 * Root-relative sources are left to `repoImages()`.
 */
export function docsMedia(prefix: string): ContentPlugin {
  return {
    name: 'docs-media',
    setup(content) {
      content.hooks.hook('file:parsed', ({ file }) => {
        if (!file?.nodes?.length) return

        visit({ nodes: file.nodes, frontmatter: file.data, meta: file.meta }, isImage, (node) => {
          const attrs = (node as [string, Record<string, unknown>])[1]
          const src = attrs?.src
          if (typeof src !== 'string' || !src || src.startsWith('/') || src.startsWith('#') || hasProtocol(src, { acceptRelative: true })) return

          const key = resolveMediaKey(file.meta.stem, src)
          if (key) attrs.src = joinURL(prefix, key)
        })
      })
    }
  }
}
