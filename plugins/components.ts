import { UButton, UAvatar, UIcon, UPageGrid, UPageCard } from '#components'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('UButton', UButton)
  nuxtApp.vueApp.component('UAvatar', UAvatar)
  nuxtApp.vueApp.component('UIcon', UIcon)
  nuxtApp.vueApp.component('UPageGrid', UPageGrid)
  nuxtApp.vueApp.component('UPageCard', UPageCard)
})
