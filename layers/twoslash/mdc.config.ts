import { defineConfig } from '@nuxtjs/mdc/config'

export default defineConfig({
  shiki: {
    transformers: async (_code, _lang, _theme, options) => {
      if (import.meta.server) {
        // TODO: better renderer, conditionally renders on build time.
        if (typeof options.meta === 'string' && options.meta?.includes('twoslash')) {
          const { transformerTwoslash } = await import('vitepress-plugin-twoslash')
          return [
            transformerTwoslash()
          ]
        }
      }
      return []
    }
  }
})
