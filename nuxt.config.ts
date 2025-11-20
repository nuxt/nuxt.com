import { createResolver } from 'nuxt/kit'
import { parseMdc } from './helpers/mdc-parser.mjs'

const { resolve } = createResolver(import.meta.url)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    'nuxt-content-twoslash',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxtjs/plausible',
    '@nuxt/eslint',
    '@nuxt/scripts',
    '@nuxtjs/turnstile',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'motion-v/nuxt',
    'nuxt-llms',
    '@nuxthub/core',
    'nuxt-charts',
    'nuxt-auth-utils'
  ],
  $development: {
    site: {
      url: 'http://localhost:3000'
    },
    image: {
      alias: {
        '/gh/': 'https://raw.githubusercontent.com',
        '/gh_avatar/': 'https://avatars.githubusercontent.com'
      },
      domains: [
        'raw.githubusercontent.com',
        'avatars.githubusercontent.com',
        'nuxt.com'
      ]
    }
  },
  $production: {
    image: {
      ipx: {
        baseURL: 'https://ipx.nuxt.com'
      }
    }
  },
  devtools: {
    enabled: true
  },
  app: {
    pageTransition: false,
    layoutTransition: false
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'dark'
  },
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'material-theme-lighter',
            dark: 'material-theme-palenight'
          },
          langs: ['sql', 'diff', 'ini']
        }
      }
    }
  },
  mdc: {
    highlight: {
      noApiRoute: false
    }
  },
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'info', 'success', 'warning', 'error', 'important']
    }
  },
  routeRules: {
    // Pre-render
    '/': { prerender: true },
    '/blog/rss.xml': { prerender: true },
    '/sitemap.xml': { prerender: true },
    '/404.html': { prerender: true },
    '/docs/3.x/getting-started/introduction': { prerender: true },
    '/docs/4.x/getting-started/introduction': { prerender: true },
    '/modules': { isr: 60 * 60 },
    '/modules/**': { isr: 60 * 60 },
    // API
    '/api/teams': { isr: 60 * 60 },
    // Admin
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
    // Redirects
    '/docs': { redirect: '/docs/getting-started/introduction', prerender: false },
    '/docs/3.x': { redirect: '/docs/3.x/getting-started/introduction', prerender: false },
    '/docs/4.x': { redirect: '/docs/4.x/getting-started/introduction', prerender: false },
    '/docs/getting-started': { redirect: '/docs/getting-started/introduction', prerender: false },
    '/docs/3.x/getting-started': { redirect: '/docs/3.x/getting-started/introduction', prerender: false },
    '/docs/4.x/getting-started': { redirect: '/docs/4.x/getting-started/introduction', prerender: false },
    '/docs/guide/concepts': { redirect: '/docs/guide/concepts/auto-imports', prerender: false },
    '/docs/3.x/guide/concepts': { redirect: '/docs/3.x/guide/concepts/auto-imports', prerender: false },
    '/docs/4.x/guide/concepts': { redirect: '/docs/4.x/guide/concepts/auto-imports', prerender: false },
    '/docs/guide/directory-structure': { redirect: '/docs/directory-structure', prerender: false },
    '/docs/3.x/guide/directory-structure': { redirect: '/docs/3.x/directory-structure', prerender: false },
    '/docs/4.x/guide/directory-structure': { redirect: '/docs/4.x/directory-structure', prerender: false },
    '/docs/guide/going-further': { redirect: '/docs/guide/going-further/experimental-features', prerender: false },
    '/docs/3.x/guide/going-further': { redirect: '/docs/3.x/guide/going-further/experimental-features', prerender: false },
    '/docs/4.x/guide/going-further': { redirect: '/docs/4.x/guide/going-further/experimental-features', prerender: false },
    '/docs/guide/going-further/edge-release-channel': { redirect: '/docs/guide/going-further/nightly-release-channel', prerender: false },
    '/docs/3.x/guide/going-further/edge-release-channel': { redirect: '/docs/3.x/guide/going-further/nightly-release-channel', prerender: false },
    '/docs/4.x/guide/going-further/edge-release-channel': { redirect: '/docs/4.x/guide/going-further/nightly-release-channel', prerender: false },
    '/docs/bridge': { redirect: '/docs/bridge/overview', prerender: false },
    '/docs/3.x/bridge': { redirect: '/docs/3.x/bridge/overview', prerender: false },
    '/docs/4.x/bridge': { redirect: '/docs/4.x/bridge/overview', prerender: false },
    '/docs/migration': { redirect: '/docs/migration/overview', prerender: false },
    '/docs/3.x/migration': { redirect: '/docs/3.x/migration/overview', prerender: false },
    '/docs/4.x/migration': { redirect: '/docs/4.x/migration/overview', prerender: false },
    '/docs/api/components': { redirect: '/docs/api/components/client-only', prerender: false },
    '/docs/3.x/api/components': { redirect: '/docs/3.x/api/components/client-only', prerender: false },
    '/docs/4.x/api/components': { redirect: '/docs/4.x/api/components/client-only', prerender: false },
    '/docs/api/composables': { redirect: '/docs/api/composables/use-app-config', prerender: false },
    '/docs/3.x/api/composables': { redirect: '/docs/3.x/api/composables/use-app-config', prerender: false },
    '/docs/4.x/api/composables': { redirect: '/docs/4.x/api/composables/use-app-config', prerender: false },
    '/docs/api/utils': { redirect: '/docs/api/utils/dollarfetch', prerender: false },
    '/docs/3.x/api/utils': { redirect: '/docs/3.x/api/utils/dollarfetch', prerender: false },
    '/docs/4.x/api/utils': { redirect: '/docs/4.x/api/utils/dollarfetch', prerender: false },
    '/docs/api/kit': { redirect: '/docs/api/kit/modules', prerender: false },
    '/docs/3.x/api/kit': { redirect: '/docs/3.x/api/kit/modules', prerender: false },
    '/docs/4.x/api/kit': { redirect: '/docs/4.x/api/kit/modules', prerender: false },
    '/docs/api/commands': { redirect: '/docs/api/commands/dev', prerender: false },
    '/docs/3.x/api/commands': { redirect: '/docs/3.x/api/commands/dev', prerender: false },
    '/docs/4.x/api/commands': { redirect: '/docs/4.x/api/commands/dev', prerender: false },
    '/docs/api/advanced': { redirect: '/docs/api/advanced/hooks', prerender: false },
    '/docs/3.x/api/advanced': { redirect: '/docs/3.x/api/advanced/hooks', prerender: false },
    '/docs/4.x/api/advanced': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/api/configuration/nuxt-config': { redirect: '/docs/api/nuxt-config', prerender: false },
    '/docs/3.x/api/configuration/nuxt-config': { redirect: '/docs/3.x/api/nuxt-config', prerender: false },
    '/docs/4.x/api/configuration/nuxt-config': { redirect: '/docs/4.x/api/nuxt-config', prerender: false },
    '/docs/examples': { redirect: '/docs/examples/hello-world', prerender: false },
    '/docs/3.x/examples': { redirect: '/docs/3.x/examples/hello-world', prerender: false },
    '/docs/4.x/examples': { redirect: '/docs/4.x/examples/hello-world', prerender: false },
    '/docs/examples/features': { redirect: '/docs/examples/features/auto-imports', prerender: false },
    '/docs/3.x/examples/features': { redirect: '/docs/3.x/examples/features/auto-imports', prerender: false },
    '/docs/4.x/examples/features': { redirect: '/docs/4.x/examples/features/auto-imports', prerender: false },
    '/docs/examples/routing': { redirect: '/docs/examples/routing/middleware', prerender: false },
    '/docs/3.x/examples/routing': { redirect: '/docs/3.x/examples/routing/middleware', prerender: false },
    '/docs/4.x/examples/routing': { redirect: '/docs/4.x/examples/routing/middleware', prerender: false },
    '/docs/examples/advanced': { redirect: '/docs/examples/advanced/config-extends', prerender: false },
    '/docs/3.x/examples/advanced': { redirect: '/docs/3.x/examples/advanced/config-extends', prerender: false },
    '/docs/4.x/examples/advanced': { redirect: '/docs/4.x/examples/advanced/config-extends', prerender: false },
    '/docs/examples/experimental': { redirect: '/docs/examples/experimental/wasm', prerender: false },
    '/docs/3.x/examples/experimental': { redirect: '/docs/3.x/examples/experimental/wasm', prerender: false },
    '/docs/4.x/examples/experimental': { redirect: '/docs/4.x/examples/experimental/wasm', prerender: false },
    '/docs/community': { redirect: '/docs/community/getting-help', prerender: false },
    '/docs/3.x/community': { redirect: '/docs/3.x/community/getting-help', prerender: false },
    '/docs/4.x/community': { redirect: '/docs/4.x/community/getting-help', prerender: false },
    '/docs/community/nuxt-community': { redirect: '/docs/community/getting-help', prerender: false },
    '/docs/3.x/community/nuxt-community': { redirect: '/docs/3.x/community/getting-help', prerender: false },
    '/docs/4.x/community/nuxt-community': { redirect: '/docs/4.x/community/getting-help', prerender: false },
    '/docs/guide/recipes': { redirect: '/docs/guide/recipes/custom-routing', prerender: false },
    '/docs/3.x/guide/recipes': { redirect: '/docs/3.x/guide/recipes/custom-routing', prerender: false },
    '/docs/4.x/guide/recipes': { redirect: '/docs/4.x/guide/recipes/custom-routing', prerender: false },
    '/docs/guide/best-practices': { redirect: '/docs/guide/best-practices/performance', prerender: false },
    '/docs/3.x/guide/best-practices': { redirect: '/docs/3.x/guide/best-practices/performance', prerender: false },
    '/docs/4.x/guide/best-practices': { redirect: '/docs/4.x/guide/best-practices/performance', prerender: false },
    '/docs/guide/going-further/custom-routing': { redirect: '/docs/guide/recipes/custom-routing', prerender: false },
    '/docs/3.x/guide/going-further/custom-routing': { redirect: '/docs/3.x/guide/recipes/custom-routing', prerender: false },
    '/docs/4.x/guide/going-further/custom-routing': { redirect: '/docs/4.x/guide/recipes/custom-routing', prerender: false },
    // new directory structure
    '/docs/3.x/directory-structure/app/middleware': { redirect: '/docs/3.x/directory-structure/middleware', prerender: false },
    '/docs/4.x/directory-structure/app': { redirect: '/docs/4.x/directory-structure/app/app', prerender: false },
    '/docs/3.x/guide/directory-structure/**': { redirect: '/docs/3.x/directory-structure', prerender: false },
    '/docs/3.x/guide/directory-structure/app/assets': { redirect: '/docs/3.x/directory-structure/assets', prerender: false },
    '/docs/4.x/guide/directory-structure/assets': { redirect: '/docs/4.x/directory-structure/app/assets', prerender: false },
    '/docs/3.x/guide/directory-structure/app/components': { redirect: '/docs/3.x/directory-structure/components', prerender: false },
    '/docs/4.x/guide/directory-structure/components': { redirect: '/docs/4.x/directory-structure/app/components', prerender: false },
    '/docs/3.x/guide/directory-structure/app/composables': { redirect: '/docs/3.x/directory-structure/composables', prerender: false },
    '/docs/4.x/guide/directory-structure/composables': { redirect: '/docs/4.x/directory-structure/app/composables', prerender: false },
    '/docs/3.x/guide/directory-structure/app/layouts': { redirect: '/docs/3.x/directory-structure/layouts', prerender: false },
    '/docs/4.x/guide/directory-structure/layouts': { redirect: '/docs/4.x/directory-structure/app/layouts', prerender: false },
    '/docs/3.x/guide/directory-structure/app/middleware': { redirect: '/docs/3.x/directory-structure/middleware', prerender: false },
    '/docs/4.x/guide/directory-structure/middleware': { redirect: '/docs/4.x/directory-structure/app/middleware', prerender: false },
    '/docs/3.x/guide/directory-structure/app/pages': { redirect: '/docs/3.x/directory-structure/pages', prerender: false },
    '/docs/4.x/guide/directory-structure/pages': { redirect: '/docs/4.x/directory-structure/app/pages', prerender: false },
    '/docs/3.x/guide/directory-structure/app/plugins': { redirect: '/docs/3.x/directory-structure/plugins', prerender: false },
    '/docs/4.x/guide/directory-structure/plugins': { redirect: '/docs/4.x/directory-structure/app/plugins', prerender: false },
    '/docs/3.x/guide/directory-structure/app/utils': { redirect: '/docs/3.x/directory-structure/utils', prerender: false },
    '/docs/4.x/guide/directory-structure/utils': { redirect: '/docs/4.x/directory-structure/app/utils', prerender: false },
    '/docs/4.x/guide/directory-structure/app': { redirect: '/docs/4.x/directory-structure/app/app', prerender: false },
    '/docs/3.x/guide/directory-structure-config/app': { redirect: '/docs/3.x/directory-structure/app-config', prerender: false },
    '/docs/4.x/guide/guide/directory-structure/app-config': { redirect: '/docs/4.x/directory-structure/app/app-config', prerender: false },
    '/docs/3.x/guide/directory-structure/app/error': { redirect: '/docs/3.x/directory-structure/error', prerender: false },
    '/docs/4.x/guide/directory-structure/error': { redirect: '/docs/4.x/directory-structure/app/error', prerender: false },
    // old directory structure in guide
    '/docs/4.x/guide/directory-structure/nuxt': { redirect: '/docs/4.x/directory-structure/nuxt', prerender: false },
    '/docs/4.x/guide/directory-structure/output': { redirect: '/docs/4.x/directory-structure/output', prerender: false },
    '/docs/4.x/guide/directory-structure/app/assets': { redirect: '/docs/4.x/directory-structure/app/assets', prerender: false },
    '/docs/4.x/guide/directory-structure/app/components': { redirect: '/docs/4.x/directory-structure/app/components', prerender: false },
    '/docs/4.x/guide/directory-structure/app/composables': { redirect: '/docs/4.x/directory-structure/app/composables', prerender: false },
    '/docs/4.x/guide/directory-structure/app/layouts': { redirect: '/docs/4.x/directory-structure/app/layouts', prerender: false },
    '/docs/4.x/guide/directory-structure/app/middleware': { redirect: '/docs/4.x/directory-structure/app/middleware', prerender: false },
    '/docs/4.x/guide/directory-structure/app/pages': { redirect: '/docs/4.x/directory-structure/app/pages', prerender: false },
    '/docs/4.x/guide/directory-structure/app/plugins': { redirect: '/docs/4.x/directory-structure/app/plugins', prerender: false },
    '/docs/4.x/guide/directory-structure/app/utils': { redirect: '/docs/4.x/directory-structure/app/utils', prerender: false },
    '/docs/4.x/guide/directory-structure/app/app': { redirect: '/docs/4.x/directory-structure/app/app', prerender: false },
    '/docs/4.x/guide/directory-structure/app/app-config': { redirect: '/docs/4.x/directory-structure/app/app-config', prerender: false },
    '/docs/4.x/guide/directory-structure/app/error': { redirect: '/docs/4.x/directory-structure/app/error', prerender: false },
    '/docs/4.x/guide/directory-structure/content': { redirect: '/docs/4.x/directory-structure/content', prerender: false },
    '/docs/4.x/guide/directory-structure/modules': { redirect: '/docs/4.x/directory-structure/modules', prerender: false },
    '/docs/4.x/guide/directory-structure/node_modules': { redirect: '/docs/4.x/directory-structure/node_modules', prerender: false },
    '/docs/4.x/guide/directory-structure/public': { redirect: '/docs/4.x/directory-structure/public', prerender: false },
    '/docs/4.x/guide/directory-structure/server': { redirect: '/docs/4.x/directory-structure/server', prerender: false },
    '/docs/4.x/guide/directory-structure/shared': { redirect: '/docs/4.x/directory-structure/shared', prerender: false },
    '/docs/4.x/guide/directory-structure/env': { redirect: '/docs/4.x/directory-structure/env', prerender: false },
    '/docs/4.x/guide/directory-structure/gitignore': { redirect: '/docs/4.x/directory-structure/gitignore', prerender: false },
    '/docs/4.x/guide/directory-structure/nuxtignore': { redirect: '/docs/4.x/directory-structure/nuxtignore', prerender: false },
    '/docs/4.x/guide/directory-structure/nuxtrc': { redirect: '/docs/4.x/directory-structure/nuxtrc', prerender: false },
    '/docs/4.x/guide/directory-structure/nuxt-config': { redirect: '/docs/4.x/directory-structure/nuxt-config', prerender: false },
    '/docs/4.x/guide/directory-structure/package': { redirect: '/docs/4.x/directory-structure/package', prerender: false },
    '/docs/4.x/guide/directory-structure/tsconfig': { redirect: '/docs/4.x/directory-structure/tsconfig', prerender: false },
    // '/docs/guide/directory-structure/nuxt.config': { redirect: '/docs/guide/directory-structure/nuxt-config', prerender: false },
    '/enterprise': { redirect: '/enterprise/support', prerender: false },
    '/support/us': { redirect: '/enterprise/sponsors', prerender: false },
    '/docs/4.x/guide/ai': { redirect: '/docs/4.x/guide/ai/mcp', prerender: false }
  },
  sourcemap: true,
  experimental: {
    defaults: {
      nuxtLink: {
        externalRelAttribute: 'noopener'
      }
    }
  },
  compatibilityDate: '2025-07-14',
  nitro: {
    compatibilityDate: {
      // Don't generate observability routes
      vercel: '2025-07-14'
    },
    prerender: {
      crawlLinks: true,
      ignore: [
        route => route.startsWith('/modules'),
        route => route.startsWith('/admin')
      ],
      autoSubfolderIndex: false
    }
  },
  hub: {
    database: 'sqlite',
    cache: true
  },
  typescript: {
    strict: false
  },
  hooks: {
    'content:file:beforeParse': async ({ file }) => {
      if (file.id.startsWith('docsv4/')) {
        file.body = file.body.replaceAll(/\(\/docs\/(?!\d\.x)/g, '(/docs/4.x/')
      }
    },
    'content:file:afterParse': async ({ file, content }) => {
      if (file.id === 'index/index.yml') {
        // @ts-expect-error -- TODO: fix this
        for (const tab of content.hero.tabs) {
          tab.content = await parseMdc(tab.content)
        }
        // @ts-expect-error -- TODO: fix this
        delete content.meta.body
      }
    }
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never'
      }
    }
  },
  icon: {
    customCollections: [{
      prefix: 'custom',
      dir: resolve('./app/assets/icons')
    }],
    clientBundle: {
      scan: true,
      includeCustomCollections: true
    },
    provider: 'iconify'
  },
  image: {
    format: ['webp', 'jpeg', 'jpg', 'png', 'svg'],
    provider: 'ipx'
  },
  llms: {
    domain: 'https://nuxt.com',
    title: 'Nuxt Docs',
    description: 'Nuxt is an open source framework that makes web development intuitive and powerful. Create performant and production-grade full-stack web apps and websites with confidence.',
    full: {
      title: 'Nuxt Docs',
      description: 'The complete Nuxt documentation and blog posts written in Markdown (MDC syntax).'
    }
  },
  turnstile: {
    siteKey: '0x4AAAAAAAP2vNBsTBT3ucZi'
  },
  twoslash: {
    floatingVueOptions: {
      classMarkdown: 'prose prose-primary dark:prose-invert'
    },
    // Skip Twoslash in dev to improve performance. Turn this on when you want to explicitly test twoslash in dev.
    enableInDev: false,
    // Do not throw when twoslash fails, the typecheck should be down in github.com/nuxt/nuxt's CI
    throws: false
  }
})
