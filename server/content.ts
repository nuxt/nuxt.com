import { createNuxtContent } from '@nuxt/content/content'
import { defineComarkPlugin } from 'comark'
import yaml from 'comark-content/plugins/yaml'
import json from 'comark-content/plugins/json'
import tracingOtel from 'comark-content/plugins/tracing/otel'
import { createInstanceSource } from '../utils/factory'
import { comarkPlugins, instancePlugins, sanitizePlugin } from './utils/content/plugins'
import { instanceSource } from './utils/content/instances'
import { contentCacheDriver } from './utils/content/cache'
import { contentTracer } from './utils/tracer'

const tracer = contentTracer()

/**
 * Takes the name of the plugin `@nuxt/content` would append to add `rel="nofollow"` to external links:
 * it has no option to turn it off, and it would end up in `/raw` markdown and replace `ProseA`'s `rel`.
 */
const keepExternalLinks = defineComarkPlugin(() => ({ name: 'external-links' }))

/**
 * Nitro replaces `import.meta.dev`. The module also imports this file, to generate types and serve the browser
 * in dev, where it isn't defined: that copy reads the checkout.
 */
const inNitro = import.meta.dev !== undefined
const local = !inNitro || import.meta.dev

const { source } = instanceSource('site')
const { listingFields } = source

/**
 * nuxt.com's own content (`content/`), owned by `@nuxt/content` and served under `/__nuxt_content`.
 *
 * Live: each request is served at the commit `main`'s content last changed in, resolved through the
 * same ref pointers as every other instance (`resolveInstanceSha()`), so a content-only push is live
 * once the push webhook moves the pointer, without a deployment. Its build snapshot is parsed at the
 * commit resolved on build and stamped with it: a cold start at a later commit only reads what changed.
 *
 * Dev reads the checkout, which the module watches.
 *
 * Imported by the module at build time too: no nitro auto-imports.
 */
export const content = createNuxtContent({
  mode: 'server-only',
  name: 'site',
  source: createInstanceSource(source, { useLocalDir: local, rootDir: import.meta.rootDir, token: process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN }),
  live: import.meta.dev
    ? undefined
    : !inNitro
        // The module's copy: live, so it keeps every component a later push may use, typed from the checkout.
        ? true
        : {
            // Dynamic: the ref pointers use nitro auto-imports.
            ref: async () => (await import('./utils/content/refs')).resolveInstanceSha('site'),
            // The pointer is in Vercel Runtime Cache, which the webhook expires in every region: read it on each
            // request, as `getInstanceAtHead()` does for the other instances.
            ttl: 0
          },
  // Options of the markdown plugin the module installs, which appends its own defaults.
  markdown: { plugins: [...comarkPlugins, keepExternalLinks()] },
  plugins: [
    yaml({ listingFields }),
    json({ listingFields }),
    ...instancePlugins('site'),
    sanitizePlugin,
    tracer && tracingOtel({ tracer })
  ],
  cache: { driver: contentCacheDriver('site') },
  hooks: {
    // The source schema only declares the markdown fields `markdownFields()` parses, and comark trusts an
    // explicit schema verbatim: the generated types would only know these. Keep every other field open.
    'typegen:field': (ctx) => {
      if (ctx.layer !== 'data') return
      if (ctx.schema.type === 'object') ctx.type = `(${ctx.type}) & Record<string, any>`
      // No hook for the root object: open it from its first field.
      if (ctx.path.length === 1) ctx.type += ';\n  [key: string]: any'
    }
  }
})
