import type { Node } from 'comark'
import type { BlogSearchDocument, BlogSearchSection } from '#shared/types'
import { plainHeading } from '#shared/utils/heading'

const BLOCK_TAGS = new Set(['p', 'li', 'pre', 'blockquote', 'td', 'th', 'tr', 'div', 'ul', 'ol', 'table', 'h4', 'h5', 'h6'])

/** Collects the text of `nodes`, keeping code blocks apart from prose so snippets can prefer prose. */
function collect(nodes: Node[], into: { text: string, code: string }, inCode = false) {
  for (const node of nodes) {
    if (typeof node === 'string') {
      into[inCode ? 'code' : 'text'] += node
    } else if (Array.isArray(node) && node[0] !== null) {
      const tag = node[0] as string
      const code = inCode || tag === 'pre'
      const separator = BLOCK_TAGS.has(tag) ? ' ' : ''
      into[code ? 'code' : 'text'] += separator
      collect(node.slice(2) as Node[], into, code)
      into[code ? 'code' : 'text'] += separator
    }
  }
}

function clean(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function sectionsOf(nodes: Node[]): BlogSearchSection[] {
  const sections: BlogSearchSection[] = [{ text: '', code: '' }]
  for (const node of nodes) {
    if (Array.isArray(node) && (node[0] === 'h2' || node[0] === 'h3')) {
      const attrs = node[1] as Record<string, unknown> | undefined
      const heading = { text: '', code: '' }
      collect(node.slice(2) as Node[], heading)
      sections.push({
        title: clean(plainHeading(heading.text)),
        id: attrs?.id as string | undefined,
        text: '',
        code: ''
      })
    } else {
      collect([node], sections.at(-1)!)
    }
  }
  return sections
    .map(section => ({ ...section, text: clean(section.text), code: clean(section.code) }))
    .filter(section => section.title || section.text || section.code)
}

/** Full text of every blog post, searched in the browser by the Updates page. */
export default defineCachedEventHandler(async (): Promise<BlogSearchDocument[]> => {
  const documents = await listBlogDocuments()
  return documents.map(({ post, nodes }) => ({
    path: post.path,
    title: post.title ?? '',
    description: post.description ?? '',
    authors: (post.authors ?? []).map(author => author.name).join(' '),
    sections: sectionsOf(nodes)
  }))
}, {
  name: 'blog-search-index',
  getKey: () => resolveInstanceSha('site'),
  swr: true,
  maxAge: 60 * 60
})
