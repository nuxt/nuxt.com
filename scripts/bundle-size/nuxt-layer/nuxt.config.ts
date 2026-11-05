import { ROUTES } from '../routes.mjs'

export default defineNuxtConfig({
  // The bundle-size workflow installs nuxt-bundle-analyzer outside the app and passes its path, so
  // the same build also records a run for the hosted comparison the PR comment links to.
  modules: process.env.NUXT_BUNDLE_ANALYZER_MODULE ? [process.env.NUXT_BUNDLE_ANALYZER_MODULE] : [],
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
