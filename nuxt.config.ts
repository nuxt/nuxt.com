import { createResolver, logger } from '@nuxt/kit'
import { version } from './package.json'
import preset from './ui'

const { resolve } = createResolver(import.meta.url)
logger.success(`Using Nuxt.com theme v${version}`)

// https://v3.nuxtjs.org/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: '@nuxt-themes/typography',
  css: [
    resolve('./assets/css/fonts.css'),
    resolve('./assets/css/style.css')
  ],
  modules: [
    '@nuxthq/ui',
    '@nuxt/content',
    '@nuxtlabs/github-module',
    // 'nuxt-newsletter',
    'nuxt-plausible',
    'nuxt-icon',
    '@nuxtjs/fontaine'
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
    openCollective: {
      apiKey: process.env.OPEN_COLLECTIVE_API_KEY
    },
    mailjet: {
      apiKey: process.env.MAILJET_API_KEY,
      secretKey: process.env.MAILJET_SECRET_KEY
    },
    public: {}
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
      theme: {
        dark: 'one-dark-pro',
        default: 'github-light'
      },
      preload: ['js', 'ts', 'html', 'css', 'vue', 'diff']
    },
    navigation: {
      fields: ['redirect']
    },
    documentDriven: {
      surround: false,
      injectPage: false
    }
  },
  tailwindcss: {
    config: {
      content: [
        resolve('./ui/*.ts')
      ]
    }
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
  nitro: {
    prerender: {
      routes: ['/docs', '/'],
      crawlLinks: true
    },
    hooks: {
      'prerender:generate': (route) => {
        const prerenderedRoutes = [
          '/',
          '/design-kit',
          '/support/solutions',
          '/support/agencies',
          /^\/docs/,
          /^\/api\/_content/
        ]

        route.skip = true

        prerenderedRoutes.forEach((condition) => {
          if (typeof condition === 'string') {
            if (condition === route.route) { route.skip = false }
          } else if (condition.test(route.route)) { route.skip = false }
        })
      }
    }
  },
  routeRules: {
    // prerender is not yet implemented, using nitro.prerender.routes and hooks for it in the meantime
    // '/': { prerender: true },
    // '/docs/**': { prerender: true },
    '/**': { cache: { swr: true, maxAge: 120, staleMaxAge: 60, headersOnly: true } },
    '/docs': { redirect: '/docs/getting-started/installation' }
    // '/modules/**': { swr: 60 },
    // '/partners/**': { swr: 60 },
    // '/showcase': { swr: 60 },
    // '/api/**': { swr: 60 }
  }
})
