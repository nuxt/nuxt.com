import type { Strapi4Error } from '@nuxtjs/strapi/dist/runtime/types/v4'
import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hooks.hook('strapi:error' as any, (e: Strapi4Error) => {
    nuxtApp.$toast.error({ title: e.error.name, description: e.error.message })
  })
})
