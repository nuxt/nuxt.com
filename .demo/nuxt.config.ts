import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

// https://v3.nuxtjs.org/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: '..',
  nitro: {
    output: {
      dir: '{{ workspaceDir }}/.vercel/output',
    }
  },
  content: {
    sources: {
      docs: {
        name: 'nuxt3-docs',
        driver: 'github',
        repo: 'nuxt/framework',
        branch: 'docs/new-website',
        dir: 'docs/content',
        // prefix: '/docs',
        token: process.env.GITHUB_TOKEN
      }
    }
  }
})
