export default defineNuxtConfig({
  modules: [
    '@comark/nuxt'
  ],

  $meta: {
    name: 'nuxi'
  },

  app: {
    viewTransition: false
  },

  experimental: {
    viewTransition: true
  },

  eve: {
    eveRoot: './layers/nuxi',
    configureVercelJson: false
  }
})
