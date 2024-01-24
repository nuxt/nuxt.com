import { defineConfig } from '@nuxtjs/mdc/config'

export default defineConfig({
  shiki: {
    transformers: async (_code, _lang, _theme, options) => {
      const { transformerTwoslash } = await import('shikiji-twoslash')
      // TODO: better renderer, conditionally renders on build time.
      if (typeof options.meta === 'string' && options.meta?.includes('twoslash'))
        return [
          transformerTwoslash({
            explicitTrigger: true
          })
        ]
      return []
    }
  }
})

console.log('Hello from mdc.config.ts')
