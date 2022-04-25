import { defineNuxtConfig } from 'nuxt'
import preset from './presets'
import colors from './presets/colors'
import typography from './presets/typography'

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
  components: [
    { path: '~/components/globals', global: true },
    '~/components'
  ],
  css: [
    '~/assets/css/fonts.css',
    '~/assets/css/scrollbars.css'
  ],
  buildModules: [
    '@nuxthq/ui',
    '@nuxthq/admin',
    '@nuxtjs/strapi',
    '@nuxt/content',
    'vue-plausible'
  ],
  runtimeConfig: {
    public: {
      baseUrl: process.env.BASE_URL || 'https://nuxt.com',
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
  tailwindcss: {
    config: {
      theme: {
        colors,
        extend: {
          typography,
          fontFamily: {
            sans: '"RoobertPRO", sans-serif'
          }
        }
      },
      plugins: [
        require('@tailwindcss/typography')
      ],
      content: [
        'presets/*.ts',
        'content/**/*.md'
      ],
      safelist: [12, 24, 36, 48, 60, 72, 84, 96, 108, 120].map(number => `pl-[${number}px]`)
    }
  },
  content: {
    highlight: {
      theme: 'one-dark-pro',
      preload: ['ini', 'json', 'js', 'ts', 'html', 'css', 'vue', 'diff', 'shell', 'markdown']
    }
  }
})
