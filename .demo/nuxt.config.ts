import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

// https://v3.nuxtjs.org/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: '..',
  content: {
    sources: {
      docs: {
        name: 'nuxt3-docs',
        driver: 'github',
        repo: 'nuxt/framework',
        branch: 'main',
        dir: 'docs/content',
        prefix: '/docs',
        token: process.env.GITHUB_TOKEN
      }
    }
  }
})
