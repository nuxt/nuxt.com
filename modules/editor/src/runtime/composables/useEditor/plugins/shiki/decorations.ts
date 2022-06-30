import { findChildren } from '@milkdown/prose'
import { Node } from '@milkdown/prose/model'
import { Decoration, DecorationSet } from '@milkdown/prose/view'
import type { Highlighter } from 'shiki-es'

export function getDecorations (doc: Node, name: string, highligther: Highlighter): DecorationSet {
  const decorations: Decoration[] = []

  findChildren(node => node.type.name === name)(doc).forEach((block) => {
    const { language } = block.node.attrs

    if (!highligther.getLoadedLanguages().includes(language)) {
      return
    }

    let from = block.pos + 1

    for (const line of highligther.codeToThemedTokens(block.node.textContent, language)) {
      for (const token of line) {
        const to = from + token.content.length
        decorations.push(
          Decoration.inline(from, to, {
            style: `color: ${token.color}`
          })
        )
        from = to
      }
      from += 1
    }
  })

  return DecorationSet.create(doc, decorations)
}
