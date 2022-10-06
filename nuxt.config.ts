import { createResolver } from '@nuxt/kit'
import preset from './ui'

const { resolve } = createResolver(import.meta.url)

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
  components: [
    resolve('./components'),
    {
      prefix: '',
      path: resolve('./components/content'),
      global: true
    },
    {
      prefix: '',
      path: resolve('./components/docs'),
      global: true
    },
    {
      prefix: '',
      path: resolve('./components/icons'),
      global: true
    }
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
        branch: 'main',
        dir: 'docs/content',
        prefix: '/docs',
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
  }
})
