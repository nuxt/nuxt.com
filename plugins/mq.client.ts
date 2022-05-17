import { Vue3Mq } from 'vue3-mq'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Vue3Mq, {
    preset: 'tailwind'
  })
  // FIXME
  const { mq } = nuxtApp.vueApp._context.provides
  nuxtApp.provide('mq', mq)
})
