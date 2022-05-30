import { findChildren } from '@milkdown/prose'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { Highlighter } from 'shiki-es'
import { getDecorations } from './decorations'

export const key = 'MILKDOWN_SHIKI'

export default (highligther: Highlighter) => {
  const nodeName = 'fence'

  return new Plugin({
    key: new PluginKey(key),
    state: {
      init: (_, { doc }) => {
        return getDecorations(doc, nodeName, highligther)
      },
      apply: (transaction, decorationSet, oldState, state) => {
        const isNodeName = state.selection.$head.parent.type.name === nodeName
        const isPreviousNodeName = oldState.selection.$head.parent.type.name === nodeName
        const oldNode = findChildren(node => node.type.name === nodeName)(oldState.doc)
        const newNode = findChildren(node => node.type.name === nodeName)(state.doc)
        const codeBlockChanged =
          transaction.docChanged &&
          (
            isNodeName ||
            isPreviousNodeName ||
            oldNode.length !== newNode.length ||
            oldNode[0]?.node.attrs.language !== newNode[0]?.node.attrs.language ||
            transaction.steps.some((step) => {
              const s = step as unknown as { from: number; to: number }
              return (
                s.from !== undefined &&
                    s.to !== undefined &&
                    oldNode.some((node) => {
                      return node.pos >= s.from && node.pos + node.node.nodeSize <= s.to
                    })
              )
            })
          )

        if (codeBlockChanged) {
          return getDecorations(transaction.doc, nodeName, highligther)
        }

        return decorationSet.map(transaction.mapping, transaction.doc)
      }
    },
    props: {
      decorations (state) {
        return this.getState(state)
      }
    }
  })
}
