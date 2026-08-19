export default defineNuxtConfig({
  buildDir: '.nuxt',
  build: {
    analyze: {
      filename: '.nuxt/analyze/{name}.json',
      template: 'raw-data'
    }
  },
  nitro: {
    prerender: {
      failOnError: false
    }
  }
})
