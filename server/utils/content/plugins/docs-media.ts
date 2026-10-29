import type { Node } from 'comark'
import { visit } from 'comark/utils'
import type { ContentPlugin } from 'comark-content'
import { hasProtocol, joinURL } from 'ufo'

/** The attributes of each element that name a media file. */
const MEDIA_ATTRS: Record<string, string[]> = { img: ['src'], video: ['src', 'poster'] }

const isMedia = (node: Node): boolean => Array.isArray(node) && typeof node[0] === 'string' && Object.hasOwn(MEDIA_ATTRS, node[0])

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
 * Point relative image sources (`./images/tab.png`, as GitHub renders them too) and video sources and posters
 * (`::video{src="./images/demo.mp4"}`) at the media item they name, served under the source's prefix:
 * `/modules/devtools/images/tab.png`.
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

        visit({ nodes: file.nodes, frontmatter: file.data, meta: file.meta }, isMedia, (node) => {
          const [tag, attrs] = node as [string, Record<string, unknown>]
          if (!attrs) return

          for (const attr of MEDIA_ATTRS[tag]!) {
            const src = attrs[attr]
            if (typeof src !== 'string' || !src || src.startsWith('/') || src.startsWith('#') || hasProtocol(src, { acceptRelative: true })) continue

            const key = resolveMediaKey(file.meta.stem, src)
            if (key) attrs[attr] = joinURL(prefix, key)
          }
        })
      })
    }
  }
}
