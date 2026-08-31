import { createResolver } from 'nuxt/kit'

const { resolve } = createResolver(import.meta.url)

// In `--ui-only` mode (default `pnpm dev`), skip the `eve/nuxt` module so the
// Eve agent runtime is never spawned locally. The UI and server routes from
// `layers/nuxi` are still loaded — only the agent itself is disabled.
// `--with-nuxi` (`pnpm dev:nuxi`) re-enables the agent while keeping ui-only proxies.
/**
 * Revalidation window for content pages and indexes.
 *
 * How long a *missed* webhook delivery can serve stale content.
 */
const CONTENT_ISR = 300

const uiOnly = process.argv.includes('--ui-only')
const withNuxi = process.argv.includes('--with-nuxi')
const nuxiEnabled = !uiOnly || withNuxi

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['./layers/nuxi'],

  modules: [
    '@nuxt/ui',
    '@nuxt/test-utils',
    '@comark/nuxt',
    '@nuxt/image',
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
    'nuxt-schema-org',
    '@nuxtjs/mcp-toolkit',
    '@nuxt/hints',
    '@vercel/analytics',
    '@vercel/speed-insights',
    'evlog/nuxt',
    ...(nuxiEnabled ? ['eve/nuxt'] : [])
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
  site: {
    name: 'Nuxt',
    url: 'https://nuxt.com',
    description: 'Build fast, production-ready web apps with Vue. File-based routing, auto-imports, and server-side rendering — all configured out of the box.',
    defaultLocale: 'en'
  },
  colorMode: {
    preference: 'dark'
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
    public: {
      eveEnabled: nuxiEnabled
    },
    contactEmail: '',
    mcpAdminToken: '',
    github: {
      token: ''
    },
    linear: {
      apiKey: '',
      teamId: 'f79ad145-d4eb-4bff-88b9-c344f006a777',
      projectId: '11a6000e-6c95-445e-85f1-a7de5c372bcd'
    },
    newsletter: {
      secret: ''
    },
    webhookSecret: '',
    openCollective: {
      apiKey: ''
    },
    resend: {
      apiKey: '',
      audienceId: ''
    }
  },
  routeRules: {
    // Content pages are ISR: rendered on demand, then served from the CDN until the push webhook purges them.
    '/': {
      isr: CONTENT_ISR,
      headers: {
        // Relative URIs per RFC 8288 — agents resolve them against the request
        // origin, so this works on production, preview deploys, and localhost.
        Link: [
          '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
          '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"; title="MCP Server Card"',
          '</llms.txt>; rel="llms"; type="text/plain"',
          '</llms-full.txt>; rel="llms-full"; type="text/plain"',
          '</sitemap.xml>; rel="sitemap"; type="application/xml"',
          '</sitemap.md>; rel="sitemap"; type="text/markdown"',
          '</design.md>; rel="design"; type="text/markdown"',
          '</mcp>; rel="mcp"; type="application/json"',
          '</docs>; rel="service-doc"; type="text/html"'
        ].join(', '),
        Vary: 'Accept, User-Agent'
      }
    },
    '/llms.txt': { isr: CONTENT_ISR, prerender: false },
    '/llms-full.txt': { isr: CONTENT_ISR, prerender: false },
    '/blog/rss.xml': { isr: CONTENT_ISR },
    '/sitemap.xml': { isr: CONTENT_ISR },
    '/sitemap.md': { isr: CONTENT_ISR },
    '/design.md': { isr: CONTENT_ISR, headers: { Vary: 'Accept, User-Agent' } },
    '/404.html': { prerender: true },
    '/modules': { isr: 60 * 60, prerender: false, headers: { Vary: 'Accept, User-Agent' } },
    '/modules/**': { isr: 60 * 60 },
    '/changelog': { isr: 60 * 60, headers: { Vary: 'Accept, User-Agent' } },
    // Markdown content negotiation routes (md-rewrite.ts emits Vercel rewrites
    // based on `Accept` and `User-Agent`, so cached responses must vary on both).
    // /raw/** is the rewrite destination — it must carry Vary too so CDNs
    // don't serve cached markdown to a browser that asked for HTML.
    '/docs/**': { isr: CONTENT_ISR, headers: { Vary: 'Accept, User-Agent' } },
    '/blog/**': { isr: CONTENT_ISR, headers: { Vary: 'Accept, User-Agent' } },
    '/deploy/**': { isr: CONTENT_ISR, headers: { Vary: 'Accept, User-Agent' } },
    '/raw/**': { isr: CONTENT_ISR, headers: { Vary: 'Accept, User-Agent' } },
    '/enterprise/**': { isr: CONTENT_ISR },
    '/templates': { isr: CONTENT_ISR },
    '/showcase': { isr: CONTENT_ISR },
    '/team': { isr: CONTENT_ISR },
    '/design-kit': { isr: CONTENT_ISR },
    '/video-courses': { isr: CONTENT_ISR },
    '/newsletter': { isr: CONTENT_ISR },
    // API
    '/api/v1/teams': { isr: 60 * 60 },
    // Admin
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
    '/admin/login': { redirect: '/login?redirect=/admin', prerender: false },
    // Auth-protected client-side area — never SSR'd.
    '/dashboard': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/_eve_internal/**': { headers: { 'cache-control': 'no-store' } },
    '/api/internal/**': { headers: { 'cache-control': 'no-store' } },
    // Main navigation
    '/api/navigation.json': { isr: CONTENT_ISR },
    '/api/content/blob/**': { isr: true },
    // Redirects
    '/docs': { redirect: '/docs/getting-started/introduction', prerender: false },
    '/docs/3.x': { redirect: '/docs/3.x/getting-started/introduction', prerender: false },
    '/docs/4.x': { redirect: '/docs/4.x/getting-started/introduction', prerender: false },
    '/docs/5.x': { redirect: '/docs/5.x/getting-started/introduction', prerender: false },
    '/docs/getting-started': { redirect: '/docs/getting-started/introduction', prerender: false },
    '/docs/3.x/getting-started': { redirect: '/docs/3.x/getting-started/introduction', prerender: false },
    '/docs/4.x/getting-started': { redirect: '/docs/4.x/getting-started/introduction', prerender: false },
    '/docs/5.x/getting-started': { redirect: '/docs/5.x/getting-started/introduction', prerender: false },
    '/docs/guide/concepts': { redirect: '/docs/guide/concepts/auto-imports', prerender: false },
    '/docs/3.x/guide/concepts': { redirect: '/docs/3.x/guide/concepts/auto-imports', prerender: false },
    '/docs/4.x/guide/concepts': { redirect: '/docs/4.x/guide/concepts/auto-imports', prerender: false },
    '/docs/5.x/guide/concepts': { redirect: '/docs/5.x/guide/concepts/auto-imports', prerender: false },
    '/docs/guide/directory-structure': { redirect: '/docs/directory-structure', prerender: false },
    '/docs/3.x/guide/directory-structure': { redirect: '/docs/3.x/directory-structure', prerender: false },
    '/docs/4.x/guide/directory-structure': { redirect: '/docs/4.x/directory-structure', prerender: false },
    '/docs/5.x/guide/directory-structure': { redirect: '/docs/5.x/directory-structure', prerender: false },
    '/docs/guide/going-further': { redirect: '/docs/guide/going-further/experimental-features', prerender: false },
    '/docs/3.x/guide/going-further': { redirect: '/docs/3.x/guide/going-further/experimental-features', prerender: false },
    '/docs/4.x/guide/going-further': { redirect: '/docs/4.x/guide/going-further/experimental-features', prerender: false },
    '/docs/5.x/guide/going-further': { redirect: '/docs/5.x/guide/going-further/experimental-features', prerender: false },
    '/docs/guide/going-further/edge-release-channel': { redirect: '/docs/guide/going-further/nightly-release-channel', prerender: false },
    '/docs/3.x/guide/going-further/edge-release-channel': { redirect: '/docs/3.x/guide/going-further/nightly-release-channel', prerender: false },
    '/docs/4.x/guide/going-further/edge-release-channel': { redirect: '/docs/4.x/guide/going-further/nightly-release-channel', prerender: false },
    '/docs/5.x/guide/going-further/edge-release-channel': { redirect: '/docs/5.x/guide/going-further/nightly-release-channel', prerender: false },
    '/docs/bridge': { redirect: '/docs/bridge/overview', prerender: false },
    '/docs/3.x/bridge': { redirect: '/docs/3.x/bridge/overview', prerender: false },
    '/docs/4.x/bridge': { redirect: '/docs/4.x/bridge/overview', prerender: false },
    '/docs/5.x/bridge': { redirect: '/docs/5.x/bridge/overview', prerender: false },
    '/docs/migration': { redirect: '/docs/migration/overview', prerender: false },
    '/docs/3.x/migration': { redirect: '/docs/3.x/migration/overview', prerender: false },
    '/docs/4.x/migration': { redirect: '/docs/4.x/migration/overview', prerender: false },
    '/docs/5.x/migration': { redirect: '/docs/5.x/migration/overview', prerender: false },
    '/docs/api/components': { redirect: '/docs/api/components/client-only', prerender: false },
    '/docs/3.x/api/components': { redirect: '/docs/3.x/api/components/client-only', prerender: false },
    '/docs/4.x/api/components': { redirect: '/docs/4.x/api/components/client-only', prerender: false },
    '/docs/5.x/api/components': { redirect: '/docs/5.x/api/components/client-only', prerender: false },
    '/docs/api/composables': { redirect: '/docs/api/composables/use-app-config', prerender: false },
    '/docs/3.x/api/composables': { redirect: '/docs/3.x/api/composables/use-app-config', prerender: false },
    '/docs/4.x/api/composables': { redirect: '/docs/4.x/api/composables/use-app-config', prerender: false },
    '/docs/5.x/api/composables': { redirect: '/docs/5.x/api/composables/use-app-config', prerender: false },
    '/docs/api/utils': { redirect: '/docs/api/utils/dollarfetch', prerender: false },
    '/docs/3.x/api/utils': { redirect: '/docs/3.x/api/utils/dollarfetch', prerender: false },
    '/docs/4.x/api/utils': { redirect: '/docs/4.x/api/utils/dollarfetch', prerender: false },
    '/docs/5.x/api/utils': { redirect: '/docs/5.x/api/utils/dollarfetch', prerender: false },
    '/docs/api/kit': { redirect: '/docs/api/kit/modules', prerender: false },
    '/docs/3.x/api/kit': { redirect: '/docs/3.x/api/kit/modules', prerender: false },
    '/docs/4.x/api/kit': { redirect: '/docs/4.x/api/kit/modules', prerender: false },
    '/docs/5.x/api/kit': { redirect: '/docs/5.x/api/kit/modules', prerender: false },
    '/docs/api/commands': { redirect: '/docs/api/commands/overview', prerender: false },
    '/docs/3.x/api/commands': { redirect: '/docs/3.x/api/commands/overview', prerender: false },
    '/docs/4.x/api/commands': { redirect: '/docs/4.x/api/commands/overview', prerender: false },
    '/docs/5.x/api/commands': { redirect: '/docs/5.x/api/commands/overview', prerender: false },
    '/docs/api/advanced': { redirect: '/docs/api/advanced/hooks', prerender: false },
    '/docs/3.x/api/advanced': { redirect: '/docs/3.x/api/advanced/hooks', prerender: false },
    '/docs/4.x/api/advanced': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/5.x/api/advanced': { redirect: '/docs/5.x/api/advanced/hooks', prerender: false },
    '/docs/api/configuration/nuxt-config': { redirect: '/docs/api/nuxt-config', prerender: false },
    '/docs/3.x/api/configuration/nuxt-config': { redirect: '/docs/3.x/api/nuxt-config', prerender: false },
    '/docs/4.x/api/configuration/nuxt-config': { redirect: '/docs/4.x/api/nuxt-config', prerender: false },
    '/docs/5.x/api/configuration/nuxt-config': { redirect: '/docs/5.x/api/nuxt-config', prerender: false },
    // New during comark migration:
    // Move examples at one canonical unversioned path since they're not versionned
    '/docs/3.x/examples/**': { redirect: { to: '/docs/examples/**', statusCode: 301 }, prerender: false },
    '/docs/4.x/examples/**': { redirect: { to: '/docs/examples/**', statusCode: 301 }, prerender: false },
    '/docs/5.x/examples/**': { redirect: { to: '/docs/examples/**', statusCode: 301 }, prerender: false },
    '/docs/3.x/examples': { redirect: { to: '/docs/examples/hello-world', statusCode: 301 }, prerender: false },
    '/docs/4.x/examples': { redirect: { to: '/docs/examples/hello-world', statusCode: 301 }, prerender: false },
    '/docs/5.x/examples': { redirect: { to: '/docs/examples/hello-world', statusCode: 301 }, prerender: false },
    '/docs/examples': { redirect: '/docs/examples/hello-world', prerender: false },
    '/docs/examples/features': { redirect: '/docs/examples/features/auto-imports', prerender: false },
    '/docs/examples/routing': { redirect: '/docs/examples/routing/middleware', prerender: false },
    '/docs/examples/advanced': { redirect: '/docs/examples/advanced/config-extends', prerender: false },
    '/docs/examples/experimental': { redirect: '/docs/examples/experimental/wasm', prerender: false },
    '/docs/community': { redirect: '/docs/community/getting-help', prerender: false },
    '/docs/3.x/community': { redirect: '/docs/3.x/community/getting-help', prerender: false },
    '/docs/4.x/community': { redirect: '/docs/4.x/community/getting-help', prerender: false },
    '/docs/5.x/community': { redirect: '/docs/5.x/community/getting-help', prerender: false },
    '/docs/community/nuxt-community': { redirect: '/docs/community/getting-help', prerender: false },
    '/docs/3.x/community/nuxt-community': { redirect: '/docs/3.x/community/getting-help', prerender: false },
    '/docs/4.x/community/nuxt-community': { redirect: '/docs/4.x/community/getting-help', prerender: false },
    '/docs/5.x/community/nuxt-community': { redirect: '/docs/5.x/community/getting-help', prerender: false },
    '/docs/guide/recipes': { redirect: '/docs/guide/recipes/custom-routing', prerender: false },
    '/docs/3.x/guide/recipes': { redirect: '/docs/3.x/guide/recipes/custom-routing', prerender: false },
    '/docs/4.x/guide/recipes': { redirect: '/docs/4.x/guide/recipes/custom-routing', prerender: false },
    '/docs/5.x/guide/recipes': { redirect: '/docs/5.x/guide/recipes/custom-routing', prerender: false },
    '/docs/guide/best-practices': { redirect: '/docs/guide/best-practices/performance', prerender: false },
    '/docs/3.x/guide/best-practices': { redirect: '/docs/3.x/guide/best-practices/performance', prerender: false },
    '/docs/4.x/guide/best-practices': { redirect: '/docs/4.x/guide/best-practices/performance', prerender: false },
    '/docs/5.x/guide/best-practices': { redirect: '/docs/5.x/guide/best-practices/performance', prerender: false },
    '/docs/guide/concepts/modules': { redirect: '/docs/guide/modules/getting-started', prerender: false },
    '/docs/3.x/guide/concepts/modules': { redirect: '/docs/3.x/guide/modules/getting-started', prerender: false },
    '/docs/4.x/guide/concepts/modules': { redirect: '/docs/4.x/guide/modules/getting-started', prerender: false },
    '/docs/5.x/guide/concepts/modules': { redirect: '/docs/5.x/guide/modules/getting-started', prerender: false },
    '/docs/guide/going-further/custom-routing': { redirect: '/docs/guide/recipes/custom-routing', prerender: false },
    '/docs/3.x/guide/going-further/custom-routing': { redirect: '/docs/3.x/guide/recipes/custom-routing', prerender: false },
    '/docs/4.x/guide/going-further/custom-routing': { redirect: '/docs/4.x/guide/recipes/custom-routing', prerender: false },
    '/docs/5.x/guide/going-further/custom-routing': { redirect: '/docs/5.x/guide/recipes/custom-routing', prerender: false },
    // new directory structure
    '/docs/3.x/directory-structure/app/middleware': { redirect: '/docs/3.x/directory-structure/middleware', prerender: false },
    '/docs/4.x/directory-structure/app': { redirect: '/docs/4.x/directory-structure/app/app', prerender: false },
    '/docs/5.x/directory-structure/app': { redirect: '/docs/4.x/directory-structure/app/app', prerender: false },
    '/docs/3.x/guide/directory-structure/**': { redirect: '/docs/3.x/directory-structure', prerender: false },
    '/docs/3.x/guide/directory-structure/app/assets': { redirect: '/docs/3.x/directory-structure/assets', prerender: false },
    '/docs/4.x/guide/directory-structure/assets': { redirect: '/docs/4.x/directory-structure/app/assets', prerender: false },
    '/docs/5.x/guide/directory-structure/assets': { redirect: '/docs/4.x/directory-structure/app/assets', prerender: false },
    '/docs/3.x/guide/directory-structure/app/components': { redirect: '/docs/3.x/directory-structure/components', prerender: false },
    '/docs/4.x/guide/directory-structure/components': { redirect: '/docs/4.x/directory-structure/app/components', prerender: false },
    '/docs/5.x/guide/directory-structure/components': { redirect: '/docs/4.x/directory-structure/app/components', prerender: false },
    '/docs/3.x/guide/directory-structure/app/composables': { redirect: '/docs/3.x/directory-structure/composables', prerender: false },
    '/docs/4.x/guide/directory-structure/composables': { redirect: '/docs/4.x/directory-structure/app/composables', prerender: false },
    '/docs/5.x/guide/directory-structure/composables': { redirect: '/docs/4.x/directory-structure/app/composables', prerender: false },
    '/docs/3.x/guide/directory-structure/app/layouts': { redirect: '/docs/3.x/directory-structure/layouts', prerender: false },
    '/docs/4.x/guide/directory-structure/layouts': { redirect: '/docs/4.x/directory-structure/app/layouts', prerender: false },
    '/docs/5.x/guide/directory-structure/layouts': { redirect: '/docs/4.x/directory-structure/app/layouts', prerender: false },
    '/docs/3.x/guide/directory-structure/app/middleware': { redirect: '/docs/3.x/directory-structure/middleware', prerender: false },
    '/docs/4.x/guide/directory-structure/middleware': { redirect: '/docs/4.x/directory-structure/app/middleware', prerender: false },
    '/docs/5.x/guide/directory-structure/middleware': { redirect: '/docs/4.x/directory-structure/app/middleware', prerender: false },
    '/docs/3.x/guide/directory-structure/app/pages': { redirect: '/docs/3.x/directory-structure/pages', prerender: false },
    '/docs/4.x/guide/directory-structure/pages': { redirect: '/docs/4.x/directory-structure/app/pages', prerender: false },
    '/docs/5.x/guide/directory-structure/pages': { redirect: '/docs/4.x/directory-structure/app/pages', prerender: false },
    '/docs/3.x/guide/directory-structure/app/plugins': { redirect: '/docs/3.x/directory-structure/plugins', prerender: false },
    '/docs/4.x/guide/directory-structure/plugins': { redirect: '/docs/4.x/directory-structure/app/plugins', prerender: false },
    '/docs/5.x/guide/directory-structure/plugins': { redirect: '/docs/4.x/directory-structure/app/plugins', prerender: false },
    '/docs/3.x/guide/directory-structure/app/utils': { redirect: '/docs/3.x/directory-structure/utils', prerender: false },
    '/docs/4.x/guide/directory-structure/utils': { redirect: '/docs/4.x/directory-structure/app/utils', prerender: false },
    '/docs/5.x/guide/directory-structure/utils': { redirect: '/docs/4.x/directory-structure/app/utils', prerender: false },
    '/docs/4.x/guide/directory-structure/app': { redirect: '/docs/4.x/directory-structure/app/app', prerender: false },
    '/docs/5.x/guide/directory-structure/app': { redirect: '/docs/4.x/directory-structure/app/app', prerender: false },
    '/docs/3.x/guide/directory-structure-config/app': { redirect: '/docs/3.x/directory-structure/app-config', prerender: false },
    '/docs/4.x/guide/guide/directory-structure/app-config': { redirect: '/docs/4.x/directory-structure/app/app-config', prerender: false },
    '/docs/5.x/guide/guide/directory-structure/app-config': { redirect: '/docs/4.x/directory-structure/app/app-config', prerender: false },
    '/docs/3.x/guide/directory-structure/app/error': { redirect: '/docs/3.x/directory-structure/error', prerender: false },
    '/docs/4.x/guide/directory-structure/error': { redirect: '/docs/4.x/directory-structure/app/error', prerender: false },
    '/docs/5.x/guide/directory-structure/error': { redirect: '/docs/4.x/directory-structure/app/error', prerender: false },
    // old directory structure in guide
    '/docs/4.x/guide/directory-structure/nuxt': { redirect: '/docs/4.x/directory-structure/nuxt', prerender: false },
    '/docs/5.x/guide/directory-structure/nuxt': { redirect: '/docs/4.x/directory-structure/nuxt', prerender: false },
    '/docs/4.x/guide/directory-structure/output': { redirect: '/docs/4.x/directory-structure/output', prerender: false },
    '/docs/5.x/guide/directory-structure/output': { redirect: '/docs/4.x/directory-structure/output', prerender: false },
    '/docs/4.x/guide/directory-structure/app/assets': { redirect: '/docs/4.x/directory-structure/app/assets', prerender: false },
    '/docs/5.x/guide/directory-structure/app/assets': { redirect: '/docs/4.x/directory-structure/app/assets', prerender: false },
    '/docs/4.x/guide/directory-structure/app/components': { redirect: '/docs/4.x/directory-structure/app/components', prerender: false },
    '/docs/5.x/guide/directory-structure/app/components': { redirect: '/docs/4.x/directory-structure/app/components', prerender: false },
    '/docs/4.x/guide/directory-structure/app/composables': { redirect: '/docs/4.x/directory-structure/app/composables', prerender: false },
    '/docs/5.x/guide/directory-structure/app/composables': { redirect: '/docs/4.x/directory-structure/app/composables', prerender: false },
    '/docs/4.x/guide/directory-structure/app/layouts': { redirect: '/docs/4.x/directory-structure/app/layouts', prerender: false },
    '/docs/5.x/guide/directory-structure/app/layouts': { redirect: '/docs/4.x/directory-structure/app/layouts', prerender: false },
    '/docs/4.x/guide/directory-structure/app/middleware': { redirect: '/docs/4.x/directory-structure/app/middleware', prerender: false },
    '/docs/5.x/guide/directory-structure/app/middleware': { redirect: '/docs/4.x/directory-structure/app/middleware', prerender: false },
    '/docs/4.x/guide/directory-structure/app/pages': { redirect: '/docs/4.x/directory-structure/app/pages', prerender: false },
    '/docs/5.x/guide/directory-structure/app/pages': { redirect: '/docs/4.x/directory-structure/app/pages', prerender: false },
    '/docs/4.x/guide/directory-structure/app/plugins': { redirect: '/docs/4.x/directory-structure/app/plugins', prerender: false },
    '/docs/5.x/guide/directory-structure/app/plugins': { redirect: '/docs/4.x/directory-structure/app/plugins', prerender: false },
    '/docs/4.x/guide/directory-structure/app/utils': { redirect: '/docs/4.x/directory-structure/app/utils', prerender: false },
    '/docs/5.x/guide/directory-structure/app/utils': { redirect: '/docs/4.x/directory-structure/app/utils', prerender: false },
    '/docs/4.x/guide/directory-structure/app/app': { redirect: '/docs/4.x/directory-structure/app/app', prerender: false },
    '/docs/5.x/guide/directory-structure/app/app': { redirect: '/docs/4.x/directory-structure/app/app', prerender: false },
    '/docs/4.x/guide/directory-structure/app/app-config': { redirect: '/docs/4.x/directory-structure/app/app-config', prerender: false },
    '/docs/5.x/guide/directory-structure/app/app-config': { redirect: '/docs/4.x/directory-structure/app/app-config', prerender: false },
    '/docs/4.x/guide/directory-structure/app/error': { redirect: '/docs/4.x/directory-structure/app/error', prerender: false },
    '/docs/5.x/guide/directory-structure/app/error': { redirect: '/docs/4.x/directory-structure/app/error', prerender: false },
    '/docs/4.x/guide/directory-structure/content': { redirect: '/docs/4.x/directory-structure/content', prerender: false },
    '/docs/5.x/guide/directory-structure/content': { redirect: '/docs/4.x/directory-structure/content', prerender: false },
    '/docs/4.x/guide/directory-structure/modules': { redirect: '/docs/4.x/directory-structure/modules', prerender: false },
    '/docs/5.x/guide/directory-structure/modules': { redirect: '/docs/4.x/directory-structure/modules', prerender: false },
    '/docs/4.x/guide/directory-structure/node_modules': { redirect: '/docs/4.x/directory-structure/node_modules', prerender: false },
    '/docs/5.x/guide/directory-structure/node_modules': { redirect: '/docs/4.x/directory-structure/node_modules', prerender: false },
    '/docs/4.x/guide/directory-structure/public': { redirect: '/docs/4.x/directory-structure/public', prerender: false },
    '/docs/5.x/guide/directory-structure/public': { redirect: '/docs/4.x/directory-structure/public', prerender: false },
    '/docs/4.x/guide/directory-structure/server': { redirect: '/docs/4.x/directory-structure/server', prerender: false },
    '/docs/5.x/guide/directory-structure/server': { redirect: '/docs/4.x/directory-structure/server', prerender: false },
    '/docs/4.x/guide/directory-structure/shared': { redirect: '/docs/4.x/directory-structure/shared', prerender: false },
    '/docs/5.x/guide/directory-structure/shared': { redirect: '/docs/4.x/directory-structure/shared', prerender: false },
    '/docs/4.x/guide/directory-structure/env': { redirect: '/docs/4.x/directory-structure/env', prerender: false },
    '/docs/5.x/guide/directory-structure/env': { redirect: '/docs/4.x/directory-structure/env', prerender: false },
    '/docs/4.x/guide/directory-structure/gitignore': { redirect: '/docs/4.x/directory-structure/gitignore', prerender: false },
    '/docs/5.x/guide/directory-structure/gitignore': { redirect: '/docs/4.x/directory-structure/gitignore', prerender: false },
    '/docs/4.x/guide/directory-structure/nuxtignore': { redirect: '/docs/4.x/directory-structure/nuxtignore', prerender: false },
    '/docs/5.x/guide/directory-structure/nuxtignore': { redirect: '/docs/4.x/directory-structure/nuxtignore', prerender: false },
    '/docs/4.x/guide/directory-structure/nuxtrc': { redirect: '/docs/4.x/directory-structure/nuxtrc', prerender: false },
    '/docs/5.x/guide/directory-structure/nuxtrc': { redirect: '/docs/4.x/directory-structure/nuxtrc', prerender: false },
    '/docs/4.x/guide/directory-structure/nuxt-config': { redirect: '/docs/4.x/directory-structure/nuxt-config', prerender: false },
    '/docs/5.x/guide/directory-structure/nuxt-config': { redirect: '/docs/4.x/directory-structure/nuxt-config', prerender: false },
    '/docs/4.x/guide/directory-structure/package': { redirect: '/docs/4.x/directory-structure/package', prerender: false },
    '/docs/5.x/guide/directory-structure/package': { redirect: '/docs/4.x/directory-structure/package', prerender: false },
    '/docs/4.x/guide/directory-structure/tsconfig': { redirect: '/docs/4.x/directory-structure/tsconfig', prerender: false },
    '/docs/5.x/guide/directory-structure/tsconfig': { redirect: '/docs/4.x/directory-structure/tsconfig', prerender: false },
    // '/docs/guide/directory-structure/nuxt.config': { redirect: '/docs/guide/directory-structure/nuxt-config', prerender: false },
    '/enterprise': { redirect: '/enterprise/agencies', prerender: false },
    '/enterprise/support': { redirect: '/enterprise/agencies', prerender: false },
    '/support/us': { redirect: '/enterprise/sponsors', prerender: false },
    '/docs/4.x/guide/ai': { redirect: '/docs/4.x/guide/ai/mcp', prerender: false },
    '/docs/5.x/guide/ai': { redirect: '/docs/5.x/guide/ai/mcp', prerender: false },
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
    '/docs/4.x/examples/essentials/hello-world': { redirect: '/docs/examples/hello-world', prerender: false },
    '/docs/5.x/examples/essentials/hello-world': { redirect: '/docs/examples/hello-world', prerender: false },
    '/docs/4.x/api/composables/usehead': { redirect: '/docs/4.x/api/composables/use-head', prerender: false },
    '/docs/5.x/api/composables/usehead': { redirect: '/docs/4.x/api/composables/use-head', prerender: false },
    '/docs/4.x/examples/composables/use-async-data': { redirect: '/docs/examples/features/data-fetching', prerender: false },
    '/docs/5.x/examples/composables/use-async-data': { redirect: '/docs/examples/features/data-fetching', prerender: false },
    '/docs/4.x/examples/composables/use-head': { redirect: '/docs/examples/features/meta-tags', prerender: false },
    '/docs/5.x/examples/composables/use-head': { redirect: '/docs/examples/features/meta-tags', prerender: false },
    '/docs/4.x/getting-started/directory-structure': { redirect: '/docs/4.x/directory-structure', prerender: false },
    '/docs/5.x/getting-started/directory-structure': { redirect: '/docs/4.x/directory-structure', prerender: false },
    '/docs/4.x/guide/going-further/modules': { redirect: '/docs/4.x/guide/modules', prerender: false },
    '/docs/5.x/guide/going-further/modules': { redirect: '/docs/4.x/guide/modules', prerender: false },
    '/docs/4.x/guide/modules/module-dependencies': { redirect: '/docs/5.x/guide/modules/module-dependencies', prerender: false },
    '/docs/4.x/guide/concepts/rendering-modes': { redirect: '/docs/4.x/guide/concepts/rendering', prerender: false },
    '/docs/5.x/guide/concepts/rendering-modes': { redirect: '/docs/4.x/guide/concepts/rendering', prerender: false },
    '/docs/4.x/guide/directory-structure/nuxt.config': { redirect: '/docs/4.x/directory-structure/nuxt-config', prerender: false },
    '/docs/5.x/guide/directory-structure/nuxt.config': { redirect: '/docs/4.x/directory-structure/nuxt-config', prerender: false },
    '/docs/4.x/getting-started/hooks': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/5.x/getting-started/hooks': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/4.x/api/nuxt-hooks': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/5.x/api/nuxt-hooks': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/4.x/guide/directory-structure/hooks': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/5.x/guide/directory-structure/hooks': { redirect: '/docs/4.x/api/advanced/hooks', prerender: false },
    '/docs/4.x/robots.txt': { redirect: '/robots.txt', prerender: false },
    '/docs/5.x/robots.txt': { redirect: '/robots.txt', prerender: false },
    '/deploy/nuxthub': { redirect: '/deploy/vercel', prerender: false }
  },
  sourcemap: true,
  experimental: {
    viewTransition: true,
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
    vercel: {
      config: {
        // Required for `x-prerender-revalidate` to purge an ISR route.
        bypassToken: process.env.VERCEL_BYPASS_TOKEN
      }
    }
  },
  hub: {
    db: {
      dialect: 'sqlite',
      applyMigrationsDuringBuild: false
    },
    kv: true,
    cache: true
  },
  vite: {
    // The search worker is an ES module (it imports `comark-content`).
    worker: { format: 'es' },
    optimizeDeps: {
      include: [
        '@comark/vue',
        '@unhead/schema-org/vue',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'valibot',
        'zod',
        'date-fns',
        'ai'
      ],
      // Pre-bundling `@sqlite.org/sqlite-wasm` breaks the wasm asset it resolves against its own module URL.
      exclude: ['vue-chrts', 'shaders', '@sqlite.org/sqlite-wasm']
    }
  },
  typescript: {
    strict: false,
    tsConfig: {
      include: ['../test/nuxt']
    }
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never'
      }
    }
  },

  evlog: {
    env: { service: 'nuxt-com' },
    pretty: process.env.CI ? false : undefined,
    sampling: {
      rates: { info: 30 },
      keep: [
        { path: '/api/chats/*' },
        { duration: 2000 }
      ]
    }
  },
  hints: {
    features: {
      hydration: true,
      lazyLoad: false,
      webVitals: true,
      thirdPartyScripts: true,
      htmlValidate: true
    }
  },
  icon: {
    customCollections: [{
      prefix: 'custom',
      dir: resolve('./app/assets/icons')
    }],
    clientBundle: {
      // Scan app source + all local content for icons. The `**/.*.{yml,yaml}`
      // pattern is needed for local `.navigation.yml` dotfiles (e.g. blog,
      // enterprise), which `*.yml` skips under `dot:false`.
      scan: {
        globInclude: ['**/*.{vue,jsx,tsx,md,mdc,mdx,yml,yaml,ts}', '**/.*.{yml,yaml}']
      },
      includeCustomCollections: true,
      // Remote docs nav icons (under `.data/`, unreachable by `scan`) — bundle them
      // so they don't pop in on client-side navigation. Regenerate when docs change.
      icons: [
        'logos:bun', 'lucide:alert-triangle', 'lucide:arrow-left-right', 'lucide:bell-dot',
        'lucide:bug-off', 'lucide:cable', 'lucide:cog', 'lucide:cooking-pot',
        'lucide:map', 'lucide:panels-top-left', 'lucide:play', 'lucide:ship',
        'lucide:square-check', 'lucide:square-terminal', 'lucide:test-tube', 'lucide:toggle-right',
        'simple-icons:codesandbox', 'simple-icons:git', 'simple-icons:google', 'simple-icons:googlechrome',
        'simple-icons:mdnwebdocs', 'simple-icons:vite', 'simple-icons:w3c', 'simple-icons:webpack',
        'vscode-icons:default-folder', 'vscode-icons:file-type-dotenv', 'vscode-icons:file-type-git', 'vscode-icons:file-type-light-config',
        'vscode-icons:file-type-css', 'vscode-icons:file-type-html', 'vscode-icons:file-type-js', 'vscode-icons:file-type-json',
        'vscode-icons:file-type-markdown', 'vscode-icons:file-type-npm', 'vscode-icons:file-type-nuxt', 'vscode-icons:file-type-tsconfig',
        'vscode-icons:file-type-typescript', 'vscode-icons:file-type-vue', 'vscode-icons:default-file',
        'vscode-icons:folder-type-app', 'vscode-icons:folder-type-asset', 'vscode-icons:folder-type-component', 'vscode-icons:folder-type-log',
        'vscode-icons:folder-type-middleware', 'vscode-icons:folder-type-node', 'vscode-icons:folder-type-nuxt', 'vscode-icons:folder-type-package',
        'vscode-icons:folder-type-plugin', 'vscode-icons:folder-type-public', 'vscode-icons:folder-type-server', 'vscode-icons:folder-type-shared',
        'vscode-icons:folder-type-src', 'vscode-icons:folder-type-temp', 'vscode-icons:folder-type-tools', 'vscode-icons:folder-type-view'
      ]
    }
  },
  image: {
    format: ['webp', 'jpeg', 'jpg', 'png', 'svg'],
    provider: 'ipx',
    // Opt-out escape hatch for images IPX must not touch, used by `DocsProseImg`.
    providers: {
      none: { provider: 'none' }
    }
  },
  llms: {
    domain: 'https://nuxt.com',
    title: 'Nuxt Docs',
    description: 'Nuxt is an open source framework that makes web development intuitive and powerful. Create performant and production-grade full-stack web apps and websites with confidence.',
    full: {
      title: 'Nuxt Docs',
      description: 'The complete Nuxt documentation and blog posts written in Markdown (MDC syntax).'
    }
    // Sections are pushed by `server/plugins/llms.ts` from the comark instances.
  },
  mcp: {
    name: 'Nuxt',
    route: '/mcp',
    browserRedirect: '/docs/guide/ai/mcp',
    icons: [
      { src: 'https://nuxt.com/icon.png', mimeType: 'image/png', sizes: ['64x64'] }
    ],
    logging: true
  },
  ogImage: {
    cacheMaxAgeSeconds: 0,
    security: {
      renderTimeout: 60000
    }
  },
  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Nuxt',
      logo: '/icon.png',
      sameAs: [
        'https://github.com/nuxt',
        'https://x.com/nuxt_js',
        'https://bsky.app/profile/nuxt.com',
        'https://www.linkedin.com/showcase/nuxt-framework/',
        'https://m.webtoo.ls/@nuxt'
      ]
    }
  },
  turnstile: {
    siteKey: '0x4AAAAAAAP2vNBsTBT3ucZi'
  }
})
