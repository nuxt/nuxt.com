import type { Node } from 'comark'
import { visit } from 'comark/utils'
import type { ContentPlugin, Source } from 'comark-content'
import { joinURL } from 'ufo'

/** `./5.typescript.md#module-code` or `5.typescript.md`: a Markdown file in the page's own directory. */
const SIBLING_MARKDOWN = /^(?:\.\/)?([^/?#]+\.md)(#.*)?$/

const isLink = (node: Node): boolean => Array.isArray(node) && node[0] === 'a'

/** The route of the file at `key` in the source: numeric prefixes and `index` dropped, as comark-content names pages. */
function routeOf(key: string): string {
  return key
    .replace(/\.md$/, '')
    .split('/')
    .map(part => part.replace(/^\d+\./, ''))
    .filter(part => part !== 'index')
    .join('/')
    .toLowerCase()
}

/**
 * Point links to sibling Markdown files (`./5.typescript.md#module-code`, as GitHub renders them too)
 * at the page they become: `/docs/4.x/api/module-builder/typescript#module-code`.
 *
 * A link to a file the source does not list is left as written.
 */
export function relativeLinks(): ContentPlugin {
  const listings = new WeakMap<Source['keys'], Promise<Set<string>>>()

  function listing(source: Source): Promise<Set<string>> {
    const list = () => Promise.resolve(source.keys()).then(keys => new Set(keys))
    if (!source.expensiveReads) return list()

    // Keyed by `keys`: comark-content reads through per-file copies of a source, which share it.
    let keys = listings.get(source.keys)
    if (!keys) {
      keys = list()
      keys.catch(() => listings.delete(source.keys))
      listings.set(source.keys, keys)
    }
    return keys
  }

  return {
    name: 'relative-links',
    setup(content) {
      content.hooks.hook('file:parsed', async ({ file, source }) => {
        if (!file?.nodes?.length || !source) return

        const links: [Record<string, unknown>, string, string][] = []
        visit({ nodes: file.nodes, frontmatter: file.data, meta: file.meta }, isLink, (node) => {
          const attrs = (node as [string, Record<string, unknown>])[1]
          const match = typeof attrs?.href === 'string' ? SIBLING_MARKDOWN.exec(attrs.href) : null
          if (!match) return

          const dir = file.meta.stem.split('/').slice(0, -1)
          links.push([attrs, [...dir, match[1]].join('/'), match[2] ?? ''])
        })
        if (!links.length) return

        const keys = await listing(source)
        for (const [attrs, key, hash] of links) {
          if (keys.has(key)) attrs.href = joinURL(file.meta.prefix ?? '/', routeOf(key)) + hash
        }
      })
    }
  }
}
