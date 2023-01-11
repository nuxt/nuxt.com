import { createResolver, logger } from '@nuxt/kit'
import { version } from './package.json'
import preset from './ui'

const { resolve } = createResolver(import.meta.url)
logger.success(`Using Nuxt.com theme v${version}`)

// https://v3.nuxtjs.org/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: '@nuxt-themes/typography',
  // app: {
  //   head: {
  //     script: [
  //       { src: 'https://masteringnuxt.com/banners/main.js', async: true }
  //     ]
  //   }
  // },
  css: [
    resolve('./assets/css/fonts.css'),
    resolve('./assets/css/style.css')
  ],
  modules: [
    process.env.NODE_ENV === 'production' ? '@nuxtjs/html-validator' : () => {},
    '@nuxthq/ui',
    '@nuxt/content',
    '@nuxtlabs/github-module',
    '@nuxtjs/plausible',
    'nuxt-icon',
    '@nuxtjs/fontaine',
    '@nuxtjs/algolia'
    // '@nuxt/devtools-edge'
  ],
  htmlValidator: {
    logLevel: 'error',
    options: {
      extends: [
        'html-validate:document',
        'html-validate:recommended',
        'html-validate:standard'
      ],
      rules: {
        'wcag/h30': 'warn',
        'wcag/h32': 'warn',
        'wcag/h36': 'warn',
        'wcag/h37': 'warn',
        'wcag/h63': 'warn',
        'wcag/h67': 'warn',
        'wcag/h71': 'warn'

      }
    }
  },
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
  runtimeConfig: {
    github: {
      token: '' || process.env.NUXT_GITHUB_TOKEN
    },
    openCollective: {
      apiKey: '' || process.env.NUXT_OPEN_COLLECTIVE_API_KEY
    },
    sendgrid: {
      apiKey: process.env.NUXT_SENDGRID_API_KEY,
      listId: process.env.NUXT_SENDGRID_LIST_ID
    },
    mailjet: {
      apiKey: '' || process.env.NUXT_MAILJET_API_KEY,
      secretKey: '' || process.env.NUXT_MAILJET_SECRET_KEY
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
      fields: ['redirect', 'titleTemplate', 'image']
    },
    documentDriven: {
      // @ts-expect-error TODO: ready for https://github.com/nuxt/content/pull/1769
      host: 'https://nuxt.com',
      surround: false,
      injectPage: false
    },
    experimental: {
      stripQueryParameters: true
    }
  },
  algolia: {
    applicationId: '1V8G7N9GF0',
    apiKey: '60a01900a4b726d667eab75b6f337592',
    docSearch: {
      indexName: 'nuxtjs',
      facetFilters: ['tags:v3']
    }
  },
  tailwindcss: {
    config: {
      content: [
        resolve('./ui/*.ts')
      ]
    }
  },
  github: {
    disableCache: true,
    maxContributors: 10
  },
  hooks: {
    'imports:extend' (imports) {
      imports.push({
        name: 'useContentHead',
        as: 'useContentHead',
        priority: 10,
        from: resolve('./composables/useContentHead')
      })
    }
  },
  nitro: {
    prerender: {
      routes: ['/', '/api/jobs.json', '/api/modules.json', '/api/sponsors.json', '/sitemap.xml', '/newsletter'],
      crawlLinks: true
    },
    handlers: [
      { handler: resolve('./server/api/modules/index.ts'), route: '/api/modules.json' },
      { handler: resolve('./server/api/jobs.ts'), route: '/api/jobs.json' },
      { handler: resolve('./server/api/sponsors.ts'), route: '/api/sponsors.json' },
      { handler: resolve('./server/routes/sitemap.xml.ts'), route: '/sitemap.xml' }
    ]
  },
  routeRules: {
    // prerendered pages
    '/': { prerender: true },
    '/design-kit': { prerender: true },
    '/support/solutions': { prerender: true },
    '/support/agencies': { prerender: true },
    '/api/_content/**': { prerender: true },
    '/api/newsletter/**': { cache: false, swr: false },
    '/docs/**': { prerender: true },
    // more frequently updated pages
    '/modules/**': { swr: 60 },
    '/partners/**': { swr: 60 },
    '/showcase': { swr: 60 },
    '/api/jobs': { swr: 60 },
    '/api/sponsors': { swr: 60 },
    '/api/email/**': { swr: 60 },
    '/api/modules/**': { swr: 60 },
    // defaults
    '/**': { cache: { swr: true, maxAge: 120, staleMaxAge: 60, headersOnly: true }, prerender: false }
  }
})
