import { createMarkdownParser } from 'comark/parse'
import toc from 'comark/plugins/toc'
import shiki from 'comark/plugins/shiki'

/** Shared Comark parser used for module READMEs, releases, and code-explorer. */
export const parseMarkdown = createMarkdownParser({
  plugins: [
    toc({ depth: 3, searchDepth: 6 }),
    shiki({
      themes: {
        light: 'material-theme-lighter',
        dark: 'material-theme-palenight'
      }
    })
  ]
})
