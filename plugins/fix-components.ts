import NuxtLink from '#app/components/nuxt-link'
/**
 * Global nuxt-link issue.
 *
 * It needs to be registered as global otherwise it will break links inside <Content />.
 */

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('NuxtLink', NuxtLink)
})
