import type { NuxtJob } from '~/types'
import { defineCachedEventHandler } from '#imports'

export default defineCachedEventHandler(async () => {
  try {
    const response: {data: NuxtJob[], links: object, meta: object} = await $fetch('https://app.vuejobs.com/feed/nuxtjs/docs?limit=-1&format=json&filter%5Bsearch%5D=nuxt')
    return response.data
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error({ error: e })
  }
}, {
  name: 'nuxt-jobs',
  maxAge: 60 * 1000
})
