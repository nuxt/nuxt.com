import { ROUTES } from '../routes.mjs'

export default defineNuxtConfig({
  build: {
    analyze: {
      filename: '.nuxt/analyze/{name}.json',
      template: 'raw-data'
    }
  },
  nitro: {
    prerender: {
      routes: [...ROUTES],
      crawlLinks: false,
      failOnError: false
    }
  }
})
