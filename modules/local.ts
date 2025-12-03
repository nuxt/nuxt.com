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
      nuxt.options.routeRules['/api/**'] = { proxy: { to: 'https://nuxt.com/api/**' } }
    }
  }
})
