import { createResolver, defineNuxtModule } from 'nuxt/kit'
import type { NitroConfig } from 'nitropack'

/**
 * Answer agent 404s with markdown instead of Nitro's JSON error body.
 *
 * Might be overridable by https://github.com/benjamincanac/nuxt-agent-discovery in the future.
 */
export default defineNuxtModule({
  meta: {
    name: 'agent'
  },
  setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    const onNitroConfig = nuxt.hook as (name: 'nitro:config', cb: (config: NitroConfig) => void) => void
    onNitroConfig('nitro:config', (nitroConfig) => {
      const existing = nitroConfig.errorHandler
      const handlers = Array.isArray(existing) ? existing : existing ? [existing] : []

      nitroConfig.errorHandler = [resolve('../server/utils/errors'), ...handlers]
    })
  }
})
