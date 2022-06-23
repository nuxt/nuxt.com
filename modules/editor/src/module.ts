import { defineNuxtModule, createResolver, addComponentsDir, addAutoImportDir /* extendViteConfig */ } from '@nuxt/kit'

export type { ComponentSchema, Content } from './runtime/composables/useEditor/types'

export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  setup () {
    const { resolve } = createResolver(import.meta.url)

    addComponentsDir({
      path: resolve('./runtime/components'),
      prefix: 'nuxt'
    })

    addAutoImportDir(resolve('./runtime/composables'))

    // extendViteConfig((config) => {
    //   config.optimizeDeps = config.optimizeDeps || {}
    //   config.optimizeDeps.include = config.optimizeDeps.include || []
    //   config.optimizeDeps.include.push(...[
    //     'vfile',
    //     'extend',
    //     'is-buffer',
    //     'debug',
    //     'flat',
    //     'gray-matter',
    //     'node-emoji',
    //     'emoji-regex'
    //   ])
    // })
  }
})
