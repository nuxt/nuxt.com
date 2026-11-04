import { addServerPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'template-og' },
  setup(_, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    nuxt.hook('modules:done', () => {
      if (nuxt.options.ogImage === false || nuxt.options.ogImage?.enabled === false) return
      addServerPlugin(resolve('../server/og/template-layout'))
    })
  }
})
