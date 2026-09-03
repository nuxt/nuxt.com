import { createMarkdownParser } from 'comark'
import type { MarkdownDocument } from 'comark'
import { comarkPlugins } from './plugins'

/**
 * Parse standalone markdown that does not come from a content instance:
 * - module READMEs
 * - release notes
 * - example source files
 */
const parser = createMarkdownParser({ plugins: comarkPlugins })

export function parseStandaloneMarkdown(markdown: string): Promise<MarkdownDocument> {
  return parser(markdown)
}
