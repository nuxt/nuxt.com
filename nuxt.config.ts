import { createResolver, logger } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

const docsSource: any = {
  name: 'nuxt-docs',
  driver: 'github',
  repo: 'nuxt/nuxt',
  branch: 'docs/pinceau-migration',
  dir: 'docs',
  prefix: '/docs',
  token: process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || ''
}
if (process.env.NUXT_DOCS_PATH) {
  docsSource.driver = 'fs'
  docsSource.base = process.env.NUXT_DOCS_PATH
}

// https://v3.nuxtjs.org/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  experimental: {
    // inlineSSRStyles: false
    emitRouteChunkError: 'reload'
  },
  extends: '@nuxt-themes/typography',
  css: [
    resolve('./assets/css/fonts.css'),
    resolve('./assets/css/style.css'),
    resolve('./assets/css/tailwind.css')
  ],
  modules: [
    '@nuxt-themes/tokens',
    process.env.NODE_ENV === 'production' ? '@nuxtjs/html-validator' : () => {},
    '@nuxt/content',
    '@nuxtlabs/github-module',
    '@nuxtjs/plausible',
    'nuxt-icon',
    '@nuxtjs/fontaine',
    '@nuxtjs/algolia',
    '@nuxtjs/color-mode',
    '@nuxtjs/tailwindcss',
    '@nuxthq/studio',
    '@nuxt/devtools',
    () => {
      if (process.env.NUXT_DOCS_PATH) { logger.success(`Using local Nuxt docs from ${process.env.NUXT_DOCS_PATH}`) }
    }
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
    },
    {
      prefix: '',
      path: resolve('./components/ui'),
      global: true
    }
  ],
  runtimeConfig: {
    githubAPI: {
      token: process.env.NUXT_GITHUB_TOKEN || ''
    },
    openCollective: {
      apiKey: process.env.NUXT_OPEN_COLLECTIVE_API_KEY || ''
    },
    sendgrid: {
      apiKey: process.env.NUXT_SENDGRID_API_KEY || '',
      listId: process.env.NUXT_SENDGRID_LIST_ID || ''
    },
    testEmail: process.env.NUXT_TEST_EMAIL || '',
    mailjet: {
      apiKey: process.env.NUXT_MAILJET_API_KEY || '',
      secretKey: process.env.NUXT_MAILJET_SECRET_KEY || ''
    },
    public: {}
  },
  colorMode: {
    classSuffix: ''
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
      host: 'https://nuxt.com',
      surround: false,
      injectPage: false
    },
    experimental: {
      stripQueryParameters: true
    },
    sources: {
      docsSource
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
    viewer: false,
    cssPath: '~/assets/css/tailwind.css',
    config: {
      theme: { extend: {} },
      content: [
        resolve('./components/**/*.{vue,js,ts}')
      ]
    }
  },
  github: {
    disableCache: true,
    maxContributors: 10
  },
  nitro: {
    output: {
      dir: '{{ workspaceDir }}/.vercel/output'
    },
    prerender: {
      crawlLinks: true
    }
  },
  routeRules: {
    // prerendered pages
    '/': { prerender: true },
    '/sitemap.xml': { prerender: true },
    '/newsletter': { prerender: true },
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
