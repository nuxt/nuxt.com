import { createContentClient } from 'comark-content/client'

export const clientContent = createContentClient({
  // Nuxt's $fetch so during SSR we have direct function calling
  // Saving additional API call
  fetch: $fetch
})
