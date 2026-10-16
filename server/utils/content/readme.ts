import type { MarkdownDocument, Node } from 'comark'
import { visit } from 'comark/utils'

interface ReadmeLocation {
  owner: string
  name: string
  /** `HEAD` when the module does not pin one: GitHub resolves it to the default branch. */
  branch: string
  /** The package directory in a monorepo, `''` at the repository root. */
  dir: string
}

/** `owner/repo#branch/path/to/package`, the `repo` format of `nuxt/modules`. */
export function readmeLocation(repo: string): ReadmeLocation | undefined {
  const [slug, ref] = repo.split('#')
  const [owner, name] = slug!.split('/')
  if (!owner || !name) return

  const [branch, ...dir] = (ref || 'HEAD').split('/')
  return { owner, name, branch: branch || 'HEAD', dir: dir.filter(Boolean).join('/') }
}

/** A scheme (`https:`, `mailto:`, `data:`), protocol-relative, or an in-page anchor. */
const isAbsolute = (url: string) => !url || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)

const MEDIA_TAGS = new Set(['img', 'source', 'video', 'audio'])

/**
 * Resolve the relative links and images of a README the way GitHub does.
 *
 * READMEs come from the npm tarball, which rarely ships the assets they point to,
 * and a monorepo package often points outside itself (`../../docs/banner.png`).
 * Images go to `raw.githubusercontent.com`, links to the file on github.com.
 *
 * `branch` overrides the one pinned in `repo`: the published README matches the
 * default (release) branch more often than the development branch `nuxt/modules` points at.
 */
export function resolveReadmeUrls(tree: MarkdownDocument, repo: string, branch?: string): MarkdownDocument {
  const location = readmeLocation(repo)
  if (!location) return tree

  const { owner, name, dir } = location
  const ref = branch || location.branch
  const base = `https://readme.invalid/${dir ? `${dir}/` : ''}`

  function resolve(url: string, kind: 'raw' | 'blob'): string {
    if (isAbsolute(url)) return url
    // `URL` does the `./`, `../` and root-relative work, and stops `..` at the repository root.
    const { pathname, search, hash } = new URL(url, base)
    const prefix = kind === 'raw'
      ? `https://raw.githubusercontent.com/${owner}/${name}/${ref}`
      : `https://github.com/${owner}/${name}/blob/${ref}`
    return `${prefix}${pathname}${search}${hash}`
  }

  /** `a.png 1x, b.png 2x`: resolve each candidate, keep its descriptor. */
  const resolveSrcset = (srcset: string) => srcset
    .split(',')
    .map((candidate) => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/)
      return [resolve(url!, 'raw'), ...descriptor].join(' ')
    })
    .join(', ')

  const isElement = (node: Node) => Array.isArray(node) && (node[0] === 'a' || MEDIA_TAGS.has(node[0] as string))

  visit(tree, isElement, (node) => {
    const [tag, attrs] = node as [string, Record<string, unknown>]
    if (tag === 'a') {
      if (typeof attrs.href === 'string') attrs.href = resolve(attrs.href, 'blob')
      return
    }
    for (const key of ['src', 'poster']) {
      if (typeof attrs[key] === 'string') attrs[key] = resolve(attrs[key], 'raw')
    }
    for (const key of ['srcset', 'srcSet']) {
      if (typeof attrs[key] === 'string') attrs[key] = resolveSrcset(attrs[key])
    }
  })

  return tree
}
