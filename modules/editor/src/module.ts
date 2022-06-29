import { defineNuxtModule, createResolver, addComponentsDir, addAutoImportDir } from '@nuxt/kit'

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
  }
})
