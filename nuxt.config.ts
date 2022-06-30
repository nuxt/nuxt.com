import { defineNuxtConfig } from 'nuxt'
import preset from './presets'

// https://v3.nuxtjs.org/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  css: [
    '~/assets/css/fonts.css'
  ],
  modules: [
    '@nuxthq/ui',
    '@nuxthq/admin',
    '@nuxtjs/strapi',
    '@nuxt/content',
    '@nuxt-modules/newsletter',
    'vue-plausible',
    './modules/editor/src/module'
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
    orbit: {
      token: process.env.ORBIT_TOKEN
    },
    mailjet: {
      apiKey: process.env.MAILJET_API_KEY,
      secretKey: process.env.MAILJET_SECRET_KEY
    },
    public: {
      baseUrl: process.env.BASE_URL || 'https://nuxt.com',
      ywsUrl: process.env.YWS_URL,
      github: {
        appSlug: process.env.GITHUB_APP_SLUG || 'nuxt'
      },
      plausible: {
        domain: process.env.PLAUSIBLE_DOMAIN
      }
    }
  },
  strapi: {
    version: 'v4',
    prefix: '/api',
    cookie: {
      path: '/'
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
  typescript: {
    shim: false
  },
  newsletter: {
    revue: {
      apiKey: process.env.REVUE_API_KEY,
      component: false
    }
  }
})
