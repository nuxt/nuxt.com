import { defineNuxtModule, useNuxt } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'anti-prefetch'
  },
  setup () {
    const nuxt = useNuxt()
    nuxt.hook('build:manifest', (manifest) => {
      for (const file in manifest) {
        if (manifest[file].isEntry) {
          manifest[file].dynamicImports = []
        }
        if (manifest[file].src?.includes('HomeGem')) {
          manifest[file].dynamicImports = []
        }
      }
    })
  }
})
