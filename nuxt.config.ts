import { defineNuxtConfig } from 'nuxt'
import preset from './ui'

// https://v3.nuxtjs.org/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  css: [
    '~/assets/css/fonts.css'
  ],
  modules: [
    '@nuxthq/ui',
    '@nuxthq/studio',
    '@nuxt/content',
    '@nuxtlabs/github-module',
    'nuxt-newsletter',
    'vue-plausible'
  ],
  build: {
    transpile: [
      'swiper'
    ]
  },
  runtimeConfig: {
    github: {
      token: process.env.GITHUB_TOKEN
    },
    mailjet: {
      apiKey: process.env.MAILJET_API_KEY,
      secretKey: process.env.MAILJET_SECRET_KEY
    },
    volta: {
      token: process.env.VOLTA_TOKEN
    },
    public: {
      studioUrl: process.env.STUDIO_URL || 'https://studio.nuxt.com',
      plausible: {
        domain: process.env.PLAUSIBLE_DOMAIN
      }
    }
  },
  ui: {
    colors: {
      primary: 'blue',
      gray: 'zinc'
    },
    preset
  },
  content: {
    highlight: {
      theme: 'one-dark-pro',
      preload: ['ini', 'json', 'js', 'ts', 'html', 'css', 'vue', 'diff', 'shell', 'markdown']
    },
    navigation: {
      fields: ['redirect']
    },
    sources: [
      {
        name: 'nuxt3-docs',
        driver: 'github',
        repo: 'nuxt/framework',
        branch: 'feat/docus-docs',
        dir: 'docs/content',
        prefix: '/docs/3.x',
        token: process.env.GITHUB_TOKEN
      },
      {
        name: 'nuxt2-docs',
        driver: 'github',
        repo: 'nuxt/nuxtjs.org',
        branch: 'main',
        dir: 'content/en/docs',
        prefix: '/docs/2.x',
        token: process.env.GITHUB_TOKEN
      }
    ]
  },
  newsletter: {
    revue: {
      apiKey: process.env.REVUE_API_KEY,
      component: false
    }
  },
  github: {
    disableCache: true,
    maxContributors: 10
  },
  experimental: {
    viteNode: true
  }
})
