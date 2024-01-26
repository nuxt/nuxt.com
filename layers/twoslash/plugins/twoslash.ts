import { defineNuxtPlugin } from '#imports'
import TwoslashFloatingVue from 'vitepress-plugin-twoslash/client'
import 'vitepress-plugin-twoslash/style.css'
import '../twoslash.css'

export default defineNuxtPlugin(({ vueApp }) => {
  vueApp.use(TwoslashFloatingVue as any)
})
