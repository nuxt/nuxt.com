import rangi from '@comark/nuxt/plugins/rangi'
import security from 'comark/plugins/security'
import type { ElementNode } from 'comark'
import SourceLink from '#layers/nuxi/app/components/tools/SourceLink.vue'

// Only the tags plain markdown produces are rendered; anything else is unwrapped or dropped.
const allowedTags = [
  'p', 'br', 'hr', 'span', 'a', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'mark', 'small', 'sub', 'sup', 'kbd',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li',
  'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'details', 'summary',
  'source-link'
]

const droppedTags = new Set(['script', 'style', 'iframe', 'frame', 'object', 'embed', 'template', 'textarea', 'title', 'noscript', 'svg', 'math'])

function unwrapTag([tag, , ...children]: ElementNode): false | ElementNode {
  return droppedTags.has(tag.toLowerCase()) ? false : ['span', {}, ...children]
}

export default defineMarkdownComponent({
  name: 'AgentComark',
  plugins: [
    rangi(),
    security({
      allowedTags,
      allowedProtocols: ['http', 'https', 'mailto'],
      allowDataImages: false,
      tagFallback: unwrapTag
    })
  ],
  components: {
    ...proseComponents,
    'source-link': SourceLink
  },
  class: '*:first:mt-0 *:last:mb-0'
})
