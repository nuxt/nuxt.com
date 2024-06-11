import { ofetch } from 'ofetch'
import { logger } from '@nuxt/kit'
import { isWindows } from 'std-env'

function normalizedDirPath(path?: string) {
  if (!path || !isWindows) {
    return path
  }

  const windowsPath = path.replace(/\\/g, '/')
  return windowsPath.startsWith('file:///') ? windowsPath : `file:///${windowsPath}`
}

const docsSourceBase = normalizedDirPath(process.env.NUXT_DOCS_PATH)
const examplesSourceBase = normalizedDirPath(process.env.NUXT_EXAMPLES_PATH)

const docsSource: any = {
  name: 'nuxt-docs',
  driver: 'github',
  repo: 'nuxt/nuxt',
  branch: 'main',
  dir: 'docs',
  prefix: '/1.docs',
  token: process.env.NUXT_GITHUB_TOKEN || ''
}
if (docsSourceBase) {
  docsSource.driver = 'fs'
  docsSource.base = docsSourceBase
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
if (examplesSourceBase) {
  examplesSource.driver = 'fs'
  examplesSource.base = examplesSourceBase
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: [
    process.env.NUXT_UI_PRO_PATH || '@nuxt/ui-pro'
  ],
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore Type circular reference
  modules: [
    'nuxt-content-twoslash',
    'nuxt-build-cache',
    '@nuxt/content',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxtjs/plausible',
    '@nuxt/fonts',
    '@nuxt/eslint',
    '@nuxtjs/turnstile',
    '@nuxthq/studio',
    '@vueuse/nuxt',
    'nuxt-og-image',
    () => {
      if (docsSourceBase) {
        logger.success(`Using local Nuxt docs from ${docsSourceBase}`)
      }
      if (examplesSourceBase) {
        logger.success(`Using local Nuxt examples from ${examplesSourceBase}`)
      }
    }
  ],
  routeRules: {
    // Pre-render
    '/api/search.json': { prerender: true },
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
  nitro: {
    prerender: {
      // failOnError: false
      // TODO: investigate
      // Ignore weird url from crawler on some modules readme
      ignore: ['/modules/%3C/span', '/modules/%253C/span', '/docs/getting-started/</span', '/docs/getting-started/%3C/span', '/modules/Mojo CSS', '/modules/Mojo%20CSS']
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
  hooks: {
    async 'prerender:routes'(ctx) {
      // Add Nuxt 2 modules to the prerender list
      const { modules } = await ofetch<{ modules: [] }>('https://api.nuxt.com/modules?version=2').catch(() => ({ modules: [] }))
      for (const module of modules) {
        ctx.routes.add(`/modules/${module.name}`)
      }
    }
  },

  $development: {
    runtimeConfig: {
      public: {
        website: {
          url: 'http://localhost:3000'
        }
      }
    }
  },
  colorMode: {
    preference: 'dark'
  },
  ui: {
    icons: ['simple-icons', 'ph', 'uil', 'heroicons', 'octicon', 'logos']
  },
  image: {
    ipx: {
      baseURL: 'https://ipx.nuxt.com'
    }
  },
  content: {
    navigation: {
      fields: ['titleTemplate']
    },
    sources: {
      docsSource,
      examplesSource
    },
    highlight: {
      theme: {
        default: 'material-theme-lighter',
        dark: 'material-theme-palenight'
      },
      langs: [
        'js',
        'ts',
        'vue',
        'css',
        'scss',
        'sass',
        'html',
        'bash',
        'md',
        'mdc',
        'json'
      ]
    }
  },
  twoslash: {
    floatingVueOptions: {
      classMarkdown: 'prose prose-primary dark:prose-invert'
    },
    // Skip Twoslash in dev to improve performance. Turn this on when you want to explictly test twoslash in dev.
    enableInDev: false,
    // Do not throw when twoslash fails, the typecheck should be down in github.com/nuxt/nuxt's CI
    throws: false
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never'
      }
    }
  },
  typescript: {
    strict: false
  },
  experimental: {
    headNext: true,
    sharedPrerenderData: true,
    appManifest: true
  },
  devtools: {
    enabled: false
  }
})
