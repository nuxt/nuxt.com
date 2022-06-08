import { codeFence } from '@milkdown/preset-commonmark'

export default codeFence.extend(
  (original, _utils, _options) => ({
    ...original,
    schema: (ctx) => {
      const originalSchema = original.schema(ctx)
      return {
        ...originalSchema,
        attrs: {
          ...originalSchema.attrs,
          filename: { default: '' }
        },
        parseMarkdown: {
          match: originalSchema.parseMarkdown.match,
          runner: (state, node, type) => {
            state.openNode(type, {
              language: node.lang as string,
              filename: (node.meta as string)?.match(/^\[(\w+)\]$/)[1] || ''
            })
            node.value && state.addText(node.value as string)
            state.closeNode()
          }
        },
        toMarkdown: {
          match: originalSchema.toMarkdown.match,
          runner: (state, node) => {
            state.addNode('code', undefined, node.content.firstChild?.text || '', {
              lang: node.attrs.language,
              meta: node.attrs.filename ? `[${node.attrs.filename}]` : ''
            })
          }
        }
      }
    }
  })
)
