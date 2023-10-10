import { UButton, UPageGrid, UPageCard } from '#components'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('UButton', UButton)
  nuxtApp.vueApp.component('UPageGrid', UPageGrid)
  nuxtApp.vueApp.component('UPageCard', UPageCard)
})
