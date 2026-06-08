// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@comark/nuxt'
  ],

  $meta: {
    name: 'nuxi'
  },

  vite: {
    optimizeDeps: {
      include: ['ai', '@ai-sdk/vue']
    }
  }
})
