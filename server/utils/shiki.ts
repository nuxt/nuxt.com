import type { Highlighter, Lang } from 'shiki-es'
import { getHighlighter } from 'shiki-es'
import nuxtTheme from './shiki/nuxt-theme.json'

let shiki: Highlighter | null = null

export const HIGHLIGHT_LANGS = [
  'ts',
  'vue',
  'md'
] as const

export async function highlightCode(code: string, lang: Lang) {
  if (!shiki) {
    // Only loading when needed
    shiki = await getHighlighter({
      // @ts-ignore
      theme: nuxtTheme,
      langs: HIGHLIGHT_LANGS as any,
    })
  }

  const supported = shiki.getLoadedLanguages().includes(lang)
  if (!supported) {
    return {
      supported,
      lang,
      code,
    }
  }

  return {
    supported: true,
    lang,
    code: shiki.codeToHtml(code, {
      lang,
      theme: 'nuxt-theme'
    }),
  }
}
