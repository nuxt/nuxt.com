import { defineNuxtPlugin } from '#imports'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'

import '@shikijs/vitepress-twoslash/style.css'
import '../twoslash.css'

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.use(TwoslashFloatingVue as any)
})
