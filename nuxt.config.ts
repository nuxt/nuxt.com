import { defineNuxtConfig } from 'nuxt3'
import preset from './presets'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  meta: {
    title: 'Nuxt: Intuitive Web Development',
    meta: [
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
      { name: 'description', content: 'Nuxt makes web development intuitive and fun. The open source framework NuxtJS makes the development of modern web applications simple.' },
      { name: 'og:site_name', content: 'Nuxt' },
      { name: 'og:type', content: 'website' },
      { name: 'og:image', content: 'https://nuxt.com/social.png' },
      { name: 'og:image:alt', content: 'Nuxt' },
      { name: 'twitter:image', content: 'https://nuxt.com/social-twitter.png' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@nuxt_js' }
    ],
    link: [
      { rel: 'icon', href: '/icon.png' }
    ]
  },
  components: {
    loader: true,
    dirs: ['~/components/atoms', '~/components/molecules', '~/components/organisms', '~/components/templates']
  },
  css: [
    '~/assets/css/fonts.css'
  ],
  buildModules: [
    '@nuxthq/ui',
    '@nuxtjs/strapi',
    'vue-plausible'
  ],
  publicRuntimeConfig: {
    baseUrl: process.env.BASE_URL || 'https://nuxt.com',
    github: {
      appSlug: process.env.GITHUB_APP_SLUG || 'nuxt'
    },
    plausible: {
      domain: process.env.PLAUSIBLE_DOMAIN
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
    preset,
    tailwindcss: {
      theme: {
        extend: {
          fontFamily: {
            sans: '"RoobertPRO", sans-serif'
          }
        }
      }
    }
  },
  tailwindcss: {
    config: {
      content: ['presets/*.ts'],
      safelist: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30].map(number => `pl-${number}`)
    }
  }
})
