import process from 'node:process'
import { consola } from 'consola'
import { defineNuxtModule } from 'nuxt/kit'

export interface ModuleOptions {
  /**
   * Enable UI-only mode for local development
   *
   * @default false
   */
  uiOnly: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'local-dev',
    configKey: 'localDev'
  },
  defaults: () => ({
    uiOnly: process.argv.includes('--ui-only')
  }),
  setup(options, nuxt) {
    if (!nuxt.options.dev && !nuxt.options._prepare) {
      return
    }

    if (options.uiOnly) {
      consola.info('Enabling UI-only mode for local development')
      const proxyRoutes = [
        '/api/stats',
        '/api/sponsors',
        '/api/contributors',
        '/api/v1/modules/**',
        '/api/v1/teams/**'
      ]
      for (const route of proxyRoutes) {
        nuxt.options.routeRules[route] = { proxy: { to: `https://nuxt.com${route}` } }
      }
    }
  }
})
