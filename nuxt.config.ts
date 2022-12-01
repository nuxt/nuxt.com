import { createResolver, logger } from '@nuxt/kit'
import { version } from './package.json'
import preset from './ui'

const { resolve } = createResolver(import.meta.url)
logger.success(`Using Nuxt.com theme v${version}`)

// https://v3.nuxtjs.org/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: '@nuxt-themes/typography',
  app: {
    head: {
      script: [
        { src: 'https://masteringnuxt.com/banners/main.js', async: true }
      ]
    }
  },
  css: [
    resolve('./assets/css/fonts.css'),
    resolve('./assets/css/style.css')
  ],
  modules: [
    // '@nuxthq/studio',
    process.env.NODE_ENV === 'production' ? '@nuxtjs/html-validator' : () => {},
    '@nuxthq/ui',
    '@nuxt/content',
    '@nuxtlabs/github-module',
    // 'nuxt-newsletter',
    'nuxt-plausible',
    'nuxt-icon',
    '@nuxtjs/fontaine',
    '@nuxtjs/algolia'
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
      fields: ['redirect', 'titleTemplate', 'image']
    },
    documentDriven: {
      surround: false,
      injectPage: false
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
      routes: ['/docs', '/', '/api/jobs.json', '/api/modules.json', '/api/sponsors.json', '/sitemap.xml'],
      crawlLinks: true
    },
    handlers: [
      { handler: resolve('./server/api/modules/index.ts'), route: '/api/modules.json' },
      { handler: resolve('./server/api/jobs.ts'), route: '/api/jobs.json' },
      { handler: resolve('./server/api/sponsors.ts'), route: '/api/sponsors.json' }
    ]
    // hooks: {
    //   'prerender:generate': (route) => {
    //     const prerenderedRoutes = [
    //       '/',
    //       '/design-kit',
    //       '/support/solutions',
    //       '/support/agencies',
    //       /^\/docs/,
    //       /^\/api\/_content/
    //     ]

    //     route.skip = true

    //     prerenderedRoutes.forEach((condition) => {
    //       if (typeof condition === 'string') {
    //         if (condition === route.route) { route.skip = false }
    //       } else if (condition.test(route.route)) { route.skip = false }
    //     })
    //   }
    // }
  }
  // routeRules: {
  //   // prerender is not yet implemented, using nitro.prerender.routes and hooks for it in the meantime
  //   // '/': { prerender: true },
  //   // '/docs/**': { prerender: true },
  //   '/**': { cache: { swr: true, maxAge: 120, staleMaxAge: 60, headersOnly: true } },
  //   '/docs': { redirect: '/docs/getting-started/installation' }
  //   // '/modules/**': { swr: 60 },
  //   // '/partners/**': { swr: 60 },
  //   // '/showcase': { swr: 60 },
  //   // '/api/**': { swr: 60 }
  // }
})
