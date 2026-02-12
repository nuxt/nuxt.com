import { createResolver } from 'nuxt/kit'
import { parseMdc } from './helpers/mdc-parser.mjs'

const { resolve } = createResolver(import.meta.url)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    'nuxt-content-twoslash',
    '@nuxt/test-utils',
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
    'nuxt-auth-utils',
    '@nuxtjs/mcp-toolkit',
    '@nuxt/hints'
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
    hub: {
      kv: {
        driver: 'vercel-runtime-cache'
      }
    },
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
          langs: ['js', 'jsx', 'json', 'ts', 'tsx', 'vue', 'css', 'html', 'bash', 'md', 'mdc', 'yaml', 'sql', 'diff', 'ini']
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
    },
    experimental: {
      componentDetection: true
    }
  },
  runtimeConfig: {
    contactEmail: '',
    github: {
      token: ''
    },
    newsletter: {
      secret: ''
    },
    openCollective: {
      apiKey: ''
    },
    sendgrid: {
      listId: '',
      apiKey: ''
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
    '/modules': { prerender: true },
    '/modules/**': { isr: 60 * 60 },
    // API
    '/api/v1/teams': { isr: 60 * 60 },
    // Admin
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
    // Main navigation
    '/api/navigation.json': { prerender: true },
    '/api/search.json': { prerender: true },
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
    '/docs/guide/concepts/modules': { redirect: '/docs/guide/modules/getting-started', prerender: false },
    '/docs/3.x/guide/concepts/modules': { redirect: '/docs/3.x/guide/modules/getting-started', prerender: false },
    '/docs/4.x/guide/concepts/modules': { redirect: '/docs/4.x/guide/modules/getting-started', prerender: false },
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
    '/enterprise': { redirect: '/enterprise/agencies', prerender: false },
    '/enterprise/support': { redirect: '/enterprise/agencies', prerender: false },
    '/support/us': { redirect: '/enterprise/sponsors', prerender: false },
    '/docs/4.x/guide/ai': { redirect: '/docs/4.x/guide/ai/mcp', prerender: false },
    '/docs/3.x/guide/ai': { redirect: '/docs/4.x/guide/ai/mcp', prerender: false },
    // showcase assets
    '/assets/websites/12go.png': { redirect: '/assets/websites/12go.webp' },
    '/assets/websites/git-lab.png': { redirect: '/assets/websites/git-lab.webp' },
    '/assets/websites/mc-donalds-france.png': { redirect: '/assets/websites/mc-donalds-france.webp' },
    '/assets/websites/stack-overflow.png': { redirect: '/assets/websites/stack-overflow.webp' },
    '/assets/websites/armani.png': { redirect: '/assets/websites/armani.webp' },
    '/assets/websites/google-ventures.png': { redirect: '/assets/websites/google-ventures.webp' },
    '/assets/websites/microsoft-edge-developer.png': { redirect: '/assets/websites/microsoft-edge-developer.webp' },
    '/assets/websites/the-north-face.png': { redirect: '/assets/websites/the-north-face.webp' },
    '/assets/websites/buy-mea-coffee.png': { redirect: '/assets/websites/buy-mea-coffee.webp' },
    '/assets/websites/hai.png': { redirect: '/assets/websites/hai.webp' },
    '/assets/websites/n8n.png': { redirect: '/assets/websites/n8n.webp' },
    '/assets/websites/tiktok-ads.png': { redirect: '/assets/websites/tiktok-ads.webp' },
    '/assets/websites/caudalie.png': { redirect: '/assets/websites/caudalie.webp' },
    '/assets/websites/harrods.png': { redirect: '/assets/websites/harrods.webp' },
    '/assets/websites/nasa-jet-propulsion-laboratory.png': { redirect: '/assets/websites/nasa-jet-propulsion-laboratory.webp' },
    '/assets/websites/timberland.png': { redirect: '/assets/websites/timberland.webp' },
    '/assets/websites/clean-shot-x.png': { redirect: '/assets/websites/clean-shot-x.webp' },
    '/assets/websites/hostel-world.png': { redirect: '/assets/websites/hostel-world.webp' },
    '/assets/websites/on-running.png': { redirect: '/assets/websites/on-running.webp' },
    '/assets/websites/too-good-to-go.png': { redirect: '/assets/websites/too-good-to-go.webp' },
    '/assets/websites/croix-rouge.png': { redirect: '/assets/websites/croix-rouge.webp' },
    '/assets/websites/hostinger.png': { redirect: '/assets/websites/hostinger.webp' },
    '/assets/websites/paul-smith.png': { redirect: '/assets/websites/paul-smith.webp' },
    '/assets/websites/toolstation.png': { redirect: '/assets/websites/toolstation.webp' },
    '/assets/websites/delvaux.png': { redirect: '/assets/websites/delvaux.webp' },
    '/assets/websites/icons8.png': { redirect: '/assets/websites/icons8.webp' },
    '/assets/websites/promod.png': { redirect: '/assets/websites/promod.webp' },
    '/assets/websites/trade-republic.png': { redirect: '/assets/websites/trade-republic.webp' },
    '/assets/websites/departamento.png': { redirect: '/assets/websites/departamento.webp' },
    '/assets/websites/immersive-garden.png': { redirect: '/assets/websites/immersive-garden.webp' },
    '/assets/websites/push-security.png': { redirect: '/assets/websites/push-security.webp' },
    '/assets/websites/upwork.png': { redirect: '/assets/websites/upwork.webp' },
    '/assets/websites/directus.png': { redirect: '/assets/websites/directus.webp' },
    '/assets/websites/le-collectionist.png': { redirect: '/assets/websites/le-collectionist.webp' },
    '/assets/websites/roland-garros.png': { redirect: '/assets/websites/roland-garros.webp' },
    '/assets/websites/vans.png': { redirect: '/assets/websites/vans.webp' },
    '/assets/websites/explore-france.png': { redirect: '/assets/websites/explore-france.webp' },
    '/assets/websites/louis-vuitton.png': { redirect: '/assets/websites/louis-vuitton.webp' },
    '/assets/websites/shaina-mote.png': { redirect: '/assets/websites/shaina-mote.webp' },
    '/assets/websites/virgin-galactic.png': { redirect: '/assets/websites/virgin-galactic.webp' },
    // missing redirects
    '/docs/4.x/examples/essentials/hello-world': { redirect: '/docs/4.x/examples/hello-world', prerender: false },
    '/docs/4.x/api/composables/usehead': { redirect: '/docs/4.x/api/composables/use-head', prerender: false },
    '/docs/4.x/examples/composables/use-async-data': { redirect: '/docs/4.x/examples/features/data-fetching', prerender: false },
    '/docs/4.x/examples/composables/use-head': { redirect: '/docs/4.x/examples/features/meta-tags', prerender: false },
    '/docs/4.x/getting-started/directory-structure': { redirect: '/docs/4.x/directory-structure', prerender: false },
    '/docs/4.x/guide/going-further/modules': { redirect: '/docs/4.x/guide/modules', prerender: false },
    '/docs/4.x/guide/concepts/rendering-modes': { redirect: '/docs/4.x/guide/concepts/rendering', prerender: false },
    '/docs/4.x/guide/directory-structure/nuxt.config': { redirect: '/docs/4.x/directory-structure/nuxt-config', prerender: false },
    '/docs/4.x/getting-started/hooks': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/4.x/api/nuxt-hooks': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/4.x/guide/directory-structure/hooks': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/4.x/robots.txt': { redirect: '/robots.txt', prerender: false },
    '/deploy/nuxthub': { redirect: '/deploy/vercel', prerender: false }
  },
  sourcemap: true,
  experimental: {
    extractAsyncDataHandlers: true,
    defaults: {
      nuxtLink: {
        externalRelAttribute: 'noopener'
      }
    },
    viteEnvironmentApi: true
  },
  compatibilityDate: '2026-01-14',
  nitro: {
    prerender: {
      crawlLinks: true,
      ignore: [
        route => route.startsWith('/modules/'),
        route => route.startsWith('/admin')
      ],
      autoSubfolderIndex: false
    }
  },
  hub: {
    db: 'sqlite',
    kv: true,
    cache: true
  },
  typescript: {
    strict: false,
    tsConfig: {
      include: ['../test/nuxt']
    }
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
    },
    sections: [
      {
        title: 'Nuxt v4 Documentation',
        contentCollection: 'docsv4',
        contentFilters: [{ field: 'extension', operator: '=', value: 'md' }]
      },
      {
        title: 'Deployment Guides',
        contentCollection: 'deploy',
        contentFilters: [{ field: 'extension', operator: '=', value: 'md' }]
      },
      {
        title: 'Nuxt v3 Documentation',
        contentCollection: 'docsv3',
        contentFilters: [{ field: 'extension', operator: '=', value: 'md' }]
      },
      {
        title: 'Blog',
        contentCollection: 'blog',
        contentFilters: [{ field: 'extension', operator: '=', value: 'md' }]
      }
    ]
  },
  mcp: {
    name: 'Nuxt',
    route: '/mcp',
    browserRedirect: '/docs/guide/ai/mcp'
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
