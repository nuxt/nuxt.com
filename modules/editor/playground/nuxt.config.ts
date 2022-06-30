import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxthq/admin',
    '@nuxthq/ui',
    '../src/module'
  ],
  nitro: {
    devStorage: {
      db: { driver: 'fs', base: '.data' }
    }
  }
})
