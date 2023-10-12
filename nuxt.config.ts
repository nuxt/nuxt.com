import { logger } from '@nuxt/kit'

const docsSource: any = {
  name: 'nuxt-docs',
  driver: 'github',
  repo: 'nuxt/nuxt',
  branch: 'new-docs',
  dir: 'docs',
  prefix: '/1.docs',
  token: process.env.NUXT_GITHUB_TOKEN || ''
}
if (process.env.NUXT_DOCS_PATH) {
  docsSource.driver = 'fs'
  docsSource.base = process.env.NUXT_DOCS_PATH
}

const examplesSource: any = {
  name: 'nuxt-examples',
  driver: 'github',
  repo: 'nuxt/examples',
  branch: 'main',
  dir: '.docs',
  prefix: '/docs/4.examples',
  token: process.env.NUXT_GITHUB_TOKEN || ''
}
if (process.env.NUXT_EXAMPLES_PATH) {
  examplesSource.driver = 'fs'
  examplesSource.base = process.env.NUXT_EXAMPLES_PATH
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  $development: {
    runtimeConfig: {
      public: {
        website: {
          url: 'http://localhost:3000'
        }
      }
    }
  },

  $production: {
    routeRules: {
      // defaults
      '/**': { cache: { swr: true, maxAge: 120, staleMaxAge: 60, headersOnly: true }, prerender: false },
      // prerendered pages
      '/': { prerender: true },
      '/api/search.json': { prerender: true },
      '/sitemap.xml': { prerender: true },
      '/newsletter': { prerender: true },
      '/design-kit': { prerender: true },
      '/enterprise/support': { prerender: true },
      '/enterprise/agencies': { prerender: true },
      '/api/_content/**': { prerender: true },
      '/docs/**': { prerender: true },
      // more frequently updated pages
      '/modules/**': { swr: 60 },
      '/showcase': { swr: 60 },
      '/docs/community/changelog': { redirect: 'https://github.com/nuxt/nuxt/releases' }
    }
  },

  routeRules: {
    '/docs': { redirect: '/docs/getting-started/introduction', prerender: false },
    '/docs/getting-started': { redirect: '/docs/getting-started/introduction', prerender: false },
    '/docs/guide/concepts': { redirect: '/docs/guide/concepts/auto-imports', prerender: false },
    '/docs/guide': { redirect: '/docs/guide/concepts/auto-imports', prerender: false },
    '/docs/examples': { redirect: '/docs/examples/hello-world', prerender: false },
    '/docs/community': { redirect: '/docs/community/nuxt-community', prerender: false },
    '/docs/api/configuration/nuxt-config': { redirect: '/docs/api/nuxt-config', prerender: false },
    '/enterprise': { redirect: '/enterprise/support', prerender: false }
  },

  extends: process.env.NUXT_UI_PRO_PATH || '@nuxt/ui-pro',

  modules: [
    '@nuxt/content',
    '@nuxtjs/plausible',
    '@nuxtjs/fontaine',
    '@nuxtjs/google-fonts',
    // '@nuxthq/studio',
    '@nuxt/ui',
    // '@nuxt/devtools',
    '@vueuse/nuxt',
    () => {
      if (process.env.NUXT_DOCS_PATH) { logger.success(`Using local Nuxt docs from ${process.env.NUXT_DOCS_PATH}`) }
      if (process.env.NUXT_EXAMPLES_PATH) { logger.success(`Using local Nuxt examples from ${process.env.NUXT_EXAMPLES_PATH}`) }
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
    public: {
      website: {
        title: 'Nuxt',
        url: 'https://nuxt.com',
        image: '/social.jpg'
      }
    }
  },

  colorMode: {
    preference: 'dark'
  },

  fontMetrics: {
    fonts: ['DM Sans']
  },

  googleFonts: {
    display: 'swap',
    download: true,
    families: {
      'DM+Sans': [400, 500, 600, 700]
    }
  },

  ui: {
    icons: ['simple-icons', 'ph', 'uil', 'heroicons', 'octicon', 'logos']
  },

  content: {
    navigation: {
      fields: ['redirect']
    },
    sources: {
      docsSource,
      examplesSource
    }
  },

  nitro: {
    prerender: {
      routes: [
        '/api/search.json'
      ]
    }
  },

  typescript: {
    strict: false
  },

  experimental: {
    appManifest: true
  }
})
