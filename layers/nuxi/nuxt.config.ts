export default defineNuxtConfig({
  modules: [
    '@comark/nuxt'
  ],

  $meta: {
    name: 'nuxi'
  },

  experimental: {
    viewTransition: true
  },

  app: {
    viewTransition: false
  },

  eve: {
    eveRoot: './layers/nuxi',
    configureVercelJson: false
  }
})
