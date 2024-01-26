import { defineConfig } from '@nuxtjs/mdc/config'

export default defineConfig({
  shiki: {
    transformers: async (_code, _lang, _theme, options) => {
      // We only runs TwoSlash at build time
      // As Nuxt Content cache the result automatically, we don't need to ship twoslash in any production bundle
      if (import.meta.server && (import.meta.prerender || import.meta.dev)) {
        if (typeof options.meta === 'string' && options.meta?.includes('twoslash')) {
          // console.log('RENDERING TWOSLASH', _code)
          const { transformerTwoslash, rendererFloatingVue } = await import('vitepress-plugin-twoslash')
          return [
            transformerTwoslash({
              renderer: rendererFloatingVue({
                floatingVue: {
                  classMarkdown: 'prose prose-primary dark:prose-invert'
                }
              })
            })
          ]
        }
        // TODO: we should fallback to a transformer that remove twoslash notations for plain text
      }
      return []
    }
  }
})
