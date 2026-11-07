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
 * nuxt.com's own content (`content/`), owned by `@nuxt/content`: it serves it under `/__nuxt_content`,
 * snapshots it at build, and generates its types. It ships with the code, so a deployment reads the
 * commit it was built from: no ref to resolve, no webhook to purge it.
 *
 * Every other instance (docs, cli, examples, module docs) reads another repository at the commit
 * its branch points to, which this file can't express: see `server/utils/content/index.ts`.
 *
 * Imported by the module at build time too: no nitro auto-imports.
 */
export const content = createNuxtContent({
  mode: 'server-only',
  name: 'site',
  source: createInstanceSource(instanceSource('site').source, { useLocalDir: true, rootDir: import.meta.rootDir }),
  // Options of the markdown plugin the module installs, which appends its own defaults.
  markdown: { plugins: [...comarkPlugins, keepExternalLinks()] },
  plugins: [
    yaml(),
    json(),
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
