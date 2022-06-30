import { Ctx, editorViewCtx, EditorViewReady } from '@milkdown/core'
import { findChildren } from '@milkdown/prose'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { Node } from '@milkdown/prose/model'
import { BUNDLED_LANGUAGES, Highlighter, Lang } from 'shiki-es'
import { getDecorations } from './decorations'

export const key = 'MILKDOWN_SHIKI'

const nodeName = 'fence'

function isLanguageSupported (language: string) {
  return BUNDLED_LANGUAGES.some(lang => lang.id === language || lang.aliases?.includes(language))
}

async function findAndLoadLanguages (ctx: Ctx, highligther: Highlighter, doc: Node) {
  const loadedLanguages = highligther.getLoadedLanguages()
  const languagesToLoad: Lang[] = []

  doc.descendants((node) => {
    const language = node.type.name === nodeName && node.attrs.language
    if (language && !languagesToLoad.includes(language) && !loadedLanguages.includes(language) && isLanguageSupported(language)) {
      languagesToLoad.push(language)
    }
  })

  await Promise.all(languagesToLoad.map(language => highligther.loadLanguage(language).catch(e => e)))

  await ctx.wait(EditorViewReady)

  const view = ctx.get(editorViewCtx)
  view.dispatch(view.state.tr.setMeta('asyncUpdate', true))
}

export default (ctx: Ctx, highligther: Highlighter) => {
  return new Plugin({
    key: new PluginKey(key),
    state: {
      init: (_, { doc }) => {
        findAndLoadLanguages(ctx, highligther, doc)
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

        if (codeBlockChanged || transaction.getMeta('asyncUpdate')) {
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
