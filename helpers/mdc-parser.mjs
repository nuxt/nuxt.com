import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import rehypeHighlight from '@nuxtjs/mdc/runtime/highlighter/rehype-nuxt'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import { createJavaScriptRegexEngine } from 'shiki'

export function createShikiHighlighter({
  langs = [],
  themes = [],
  bundledLangs = {},
  bundledThemes = {},
  getMdcConfigs,
  options: shikiOptions,
  engine
} = {}) {
  let shiki
  let configs
  async function _getShiki() {
    const { createHighlighterCore, addClassToHast, isSpecialLang, isSpecialTheme } = await import('shiki/core')
    const { transformerNotationDiff, transformerNotationErrorLevel, transformerNotationFocus, transformerNotationHighlight } = await import('@shikijs/transformers')
    const shiki2 = await createHighlighterCore({
      langs,
      themes,
      engine: engine || createJavaScriptRegexEngine()
    })
    for await (const config of await getConfigs()) {
      await config.shiki?.setup?.(shiki2)
    }
    return {
      shiki: shiki2,
      addClassToHast,
      isSpecialLang,
      isSpecialTheme,
      transformers: [
        transformerNotationDiff(),
        transformerNotationErrorLevel(),
        transformerNotationFocus(),
        transformerNotationHighlight()
      ]
    }
  }
  async function getShiki() {
    if (!shiki) {
      shiki = _getShiki()
    }
    return shiki
  }
  async function getConfigs() {
    if (!configs) {
      configs = Promise.resolve(getMdcConfigs?.() || [])
    }
    return configs
  }
  const highlighter = async (code, lang, theme, options = {}) => {
    const {
      shiki: shiki2,
      addClassToHast,
      isSpecialLang,
      isSpecialTheme,
      transformers: baseTransformers
    } = await getShiki()
    const codeToHastOptions = {
      defaultColor: false,
      meta: {
        __raw: options.meta
      }
    }
    if (lang === 'ts-type' || lang === 'typescript-type') {
      lang = 'typescript'
      codeToHastOptions.grammarContextCode = 'let a:'
    } else if (lang === 'vue-html' || lang === 'vue-template') {
      lang = 'vue'
      codeToHastOptions.grammarContextCode = '<template>'
    }
    const themesObject = { ...typeof theme === 'string' ? { default: theme } : theme || {} }
    const loadedThemes = shiki2.getLoadedThemes()
    const loadedLanguages = shiki2.getLoadedLanguages()
    if (typeof lang === 'string' && !loadedLanguages.includes(lang) && !isSpecialLang(lang)) {
      if (bundledLangs[lang]) {
        await shiki2.loadLanguage(bundledLangs[lang])
      } else {
        if (import.meta.dev) {
          console.warn(`[@nuxtjs/mdc] Language "${lang}" is not loaded to the Shiki highlighter, fallback to plain text. Add the language to "mdc.highlight.langs" to fix this.`)
        }
        lang = 'text'
      }
    }
    for (const [color, theme2] of Object.entries(themesObject)) {
      if (typeof theme2 === 'string' && !loadedThemes.includes(theme2) && !isSpecialTheme(theme2)) {
        if (bundledThemes[theme2]) {
          await shiki2.loadTheme(bundledThemes[theme2])
        } else {
          if (import.meta.dev) {
            console.warn(`[@nuxtjs/mdc] Theme "${theme2}" is not loaded to the Shiki highlighter. Add the theme to "mdc.highlight.themes" to fix this.`)
          }
          themesObject[color] = 'none'
        }
      }
    }
    const transformers = [
      ...baseTransformers
    ]
    for (const config of await getConfigs()) {
      const newTransformers = typeof config.shiki?.transformers === 'function' ? await config.shiki?.transformers(code, lang, theme, options) : config.shiki?.transformers || []
      transformers.push(...newTransformers)
    }
    const root = shiki2.codeToHast(code.trimEnd(), {
      lang,
      ...codeToHastOptions,
      themes: themesObject,
      transformers: [
        ...transformers,
        {
          name: 'mdc:highlight',
          line(node, line) {
            if (options.highlights?.includes(line))
              addClassToHast(node, 'highlight')
            node.properties.line = line
          }
        },
        {
          name: 'mdc:newline',
          line(node) {
            if (code?.includes('\n')) {
              if (node.children.length === 0 || (node.children.length === 1 && node.children[0].type === 'element' && node.children[0].children.length === 1 && node.children[0].children[0].type === 'text' && node.children[0].children[0].value === '')) {
                node.children = [{
                  type: 'element',
                  tagName: 'span',
                  properties: {
                    emptyLinePlaceholder: true
                  },
                  children: [{ type: 'text', value: '\n' }]
                }]
                return
              }
              const last = node.children.at(-1)
              if (last?.type === 'element' && last.tagName === 'span') {
                const text = last.children.at(-1)
                if (text?.type === 'text')
                  text.value += '\n'
              }
            }
          }
        }
      ]
    })
    const preEl = root.children[0]
    const codeEl = preEl.children[0]
    const wrapperStyle = shikiOptions?.wrapperStyle
    preEl.properties.style = wrapperStyle ? typeof wrapperStyle === 'string' ? wrapperStyle : preEl.properties.style : ''
    const styles = []
    Object.keys(themesObject).forEach((color) => {
      const colorScheme = color !== 'default' ? `.${color}` : ''
      styles.push(
        wrapperStyle ? `${colorScheme} .shiki,` : '',
        `html .${color} .shiki span {`,
        `color: var(--shiki-${color});`,
        `background: var(--shiki-${color}-bg);`,
        `font-style: var(--shiki-${color}-font-style);`,
        `font-weight: var(--shiki-${color}-font-weight);`,
        `text-decoration: var(--shiki-${color}-text-decoration);`,
        '}'
      )
      styles.push(
        `html${colorScheme} .shiki span {`,
        `color: var(--shiki-${color});`,
        `background: var(--shiki-${color}-bg);`,
        `font-style: var(--shiki-${color}-font-style);`,
        `font-weight: var(--shiki-${color}-font-weight);`,
        `text-decoration: var(--shiki-${color}-text-decoration);`,
        '}'
      )
    })
    return {
      tree: codeEl.children,
      className: Array.isArray(preEl.properties.class) ? preEl.properties.class.join(' ') : preEl.properties.class,
      inlineStyle: preEl.properties.style,
      style: styles.join('')
    }
  }
  return highlighter
}

const bundledLangs = {
  sql: () => import('shiki/langs/sql.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  ini: () => import('shiki/langs/ini.mjs'),
  properties: () => import('shiki/langs/ini.mjs'),
  vue: () => import('shiki/langs/vue.mjs'),
  js: () => import('shiki/langs/js.mjs'),
  ts: () => import('shiki/langs/ts.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  json: () => import('shiki/langs/json.mjs')

}
const bundledThemes = {
  'material-theme-lighter': () => import('shiki/themes/material-theme-lighter.mjs').then(r => r.default),
  'material-theme-palenight': () => import('shiki/themes/material-theme-palenight.mjs').then(r => r.default)
}
const options = { theme: { light: 'material-theme-lighter', default: 'material-theme-lighter', dark: 'material-theme-palenight' } }
let configs
export function getMdcConfigs() {
  if (!configs) {
    configs = Promise.all([
      // import('/Users/far/projects/nuxt/nuxt.com/node_modules/.pnpm/nuxt-content-twoslash@0.1.2_@nuxtjs+mdc@0.16.1_magicast@0.3.5__magicast@0.3.5/node_modules/nuxt-content-twoslash/dist/runtime/mdc.config').then(m => m.default)
    ])
  }
  return configs
}
const engine = createOnigurumaEngine(() => import('shiki/wasm'))
const highlighter = createShikiHighlighter({ bundledLangs, bundledThemes, options, getMdcConfigs, engine })

export async function parseMdc(content) {
  return await parseMarkdown(content, {
    rehype: {
      plugins: {
        highlight: {
          instance: rehypeHighlight
        }
      }
    },
    highlight: {
      highlighter,
      langs: ['js', 'vue'],
      theme: {
        default: 'material-theme-lighter',
        dark: 'material-theme-palenight'
      }
    }
  })
}
