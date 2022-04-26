import { defineNuxtConfig } from 'nuxt'
import preset from './presets'
import colors from './presets/colors'
import typography from './presets/typography'

// https://v3.nuxtjs.org/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
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
        'content/**/*.md',
        'editor/**/*.vue'
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
