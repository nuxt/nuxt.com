import { ofetch } from 'ofetch'
import { createResolver } from 'nuxt/kit'

const { resolve } = createResolver(import.meta.url)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Type circular reference
  modules: [
    '@nuxt/ui-pro',
    'nuxt-content-twoslash',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxtjs/plausible',
    '@nuxt/eslint',
    '@nuxt/scripts',
    '@nuxtjs/turnstile',
    '@vueuse/nuxt',
    'nuxt-og-image',
    // 'nuxt-rebundle',
    'nuxt-llms'
  ],
  $development: {
    runtimeConfig: {
      public: {
        website: {
          url: 'http://localhost:3000'
        }
      }
    },
    image: {
      alias: {
        '/gh/': 'https://raw.githubusercontent.com',
        '/gh_avatar/': 'https://avatars.githubusercontent.com'
      },
      domains: [
        'raw.githubusercontent.com',
        'avatars.githubusercontent.com'
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
    enabled: false
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
          langs: ['sql', 'diff']
        }
      }
    },
    preview: {
      api: 'https://api.nuxt.studio'
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
    '/api/templates.json': { prerender: true },
    '/blog/rss.xml': { prerender: true },
    // '/sitemap.xml': { prerender: true },
    '/newsletter': { prerender: true },
    // Redirects
    '/docs': { redirect: '/docs/getting-started/introduction', prerender: false },
    '/docs/getting-started': { redirect: '/docs/getting-started/introduction', prerender: false },
    '/docs/guide/concepts': { redirect: '/docs/guide/concepts/auto-imports', prerender: false },
    '/docs/guide/directory-structure': { redirect: '/docs/guide/directory-structure/app', prerender: false },
    '/docs/guide/going-further': { redirect: '/docs/guide/going-further/experimental-features', prerender: false },
    '/docs/guide/going-further/edge-release-channel': { redirect: '/docs/guide/going-further/nightly-release-channel', prerender: false },
    '/docs/bridge': { redirect: '/docs/bridge/overview', prerender: false },
    '/docs/migration': { redirect: '/docs/migration/overview', prerender: false },
    '/docs/api/components': { redirect: '/docs/api/components/client-only', prerender: false },
    '/docs/api/composables': { redirect: '/docs/api/composables/use-app-config', prerender: false },
    '/docs/api/utils': { redirect: '/docs/api/utils/dollarfetch', prerender: false },
    '/docs/api/kit': { redirect: '/docs/api/kit/modules', prerender: false },
    '/docs/api/commands': { redirect: '/docs/api/commands/dev', prerender: false },
    '/docs/api/advanced': { redirect: '/docs/api/advanced/hooks', prerender: false },
    '/docs/api/configuration/nuxt-config': { redirect: '/docs/api/nuxt-config', prerender: false },
    '/docs/examples': { redirect: '/docs/examples/hello-world', prerender: false },
    '/docs/examples/features': { redirect: '/docs/examples/features/auto-imports', prerender: false },
    '/docs/examples/routing': { redirect: '/docs/examples/routing/middleware', prerender: false },
    '/docs/examples/advanced': { redirect: '/docs/examples/advanced/config-extends', prerender: false },
    '/docs/examples/experimental': { redirect: '/docs/examples/experimental/wasm', prerender: false },
    '/docs/community': { redirect: '/docs/community/getting-help', prerender: false },
    '/docs/community/nuxt-community': { redirect: '/docs/community/getting-help', prerender: false },
    '/docs/guide/recipes': { redirect: '/docs/guide/recipes/custom-routing', prerender: false },
    '/docs/guide/going-further/custom-routing': { redirect: '/docs/guide/recipes/custom-routing', prerender: false },
    // '/docs/guide/directory-structure/nuxt.config': { redirect: '/docs/guide/directory-structure/nuxt-config', prerender: false },
    '/enterprise': { redirect: '/enterprise/support', prerender: false }
  },
  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2024-07-18',
  nitro: {
    prerender: {
      // failOnError: false
      // TODO: investigate
      // Ignore weird url from crawler on some modules readme
      ignore: ['/modules/%3C/span', '/modules/%253C/span', '/docs/getting-started/</span', '/docs/getting-started/%3C/span', '/modules/Mojo CSS', '/modules/Mojo%20CSS', '/enterprise/agencies?service=content-marketing', '/enterprise/agencies?service=mobile-development']
    },
    hooks: {
      'prerender:generate'(route) {
        // TODO: fix issue with recursive fetches with query string, e.g.
        // `/enterprise/agencies?region=europe&amp;amp;amp;service=ecommerce&amp;amp;service=ecommerce&amp;service=content-marketing`
        if (route.route?.includes('&amp;')) {
          route.skip = true
        }
      }
    }
  },
  typescript: {
    strict: false
  },
  hooks: {
    async 'prerender:routes'(ctx) {
      // Add Nuxt 2 modules to the prerender list
      const { modules } = await ofetch<{ modules: [] }>('https://api.nuxt.com/modules?version=2').catch(() => ({ modules: [] }))
      for (const module of modules) {
        ctx.routes.add(`/modules/${module.name}`)
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
  llms: {
    domain: 'https://nuxt.com',
    title: 'Nuxt Docs',
    description: 'Nuxt is an open source framework that makes web development intuitive and powerful. Create performant and production-grade full-stack web apps and websites with confidence.',
    full: {
      title: 'Nuxt Docs',
      description: 'The complete Nuxt documentation, blog posts and changelog written in Markdown (MDC syntax).'
    }
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
