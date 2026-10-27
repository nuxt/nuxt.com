export default defineNuxtConfig({
  extends: [
    '@nuxt/examples-ui',
  ],

  modules: [
    'eve/nuxt',
  ],

  compatibilityDate: '2024-04-03',

  vite: {
    optimizeDeps: {
      // TODO: remove once https://github.com/vercel/eve/pull/5404 is released
      include: ['eve/vue'],
    },
  },
})
