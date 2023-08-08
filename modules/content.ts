import { defineNuxtModule, addPluginTemplate  } from 'nuxt/kit'
import { genImport } from 'knitwork'
import { pascalCase } from 'scule'

export default defineNuxtModule({
  meta: {
    name: 'content-components',
    configKey: 'content'
  },
  defaults: {
    components: []
  },
  setup (options) {
    const components = (options.components || []).map(pascalCase)

    addPluginTemplate({
      filename: 'plugins/content-components.ts',
      write: true,
      getContents: () => {
        return `${genImport('#components', components)}

        export default defineNuxtPlugin((nuxtApp) => {
          ${components.map(name => `nuxtApp.vueApp.component('${name}', ${name});`).join('\n')}
        })
        `
      }
    })
  }
})
