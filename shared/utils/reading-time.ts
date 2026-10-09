import type { Node } from 'comark'

const WORDS_PER_MINUTE = 230

function countWords(nodes: Node[]): number {
  let words = 0
  for (const node of nodes) {
    if (typeof node === 'string') {
      words += node.split(/\s+/).filter(Boolean).length
    } else if (Array.isArray(node) && node[0] !== null) {
      words += countWords(node.slice(2) as Node[])
    }
  }
  return words
}

/** Estimated minutes to read a parsed document, code blocks included. */
export function readingMinutes(nodes: Node[] | undefined): number {
  return Math.max(1, Math.round(countWords(nodes ?? []) / WORDS_PER_MINUTE))
}
