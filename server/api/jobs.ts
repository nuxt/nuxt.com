import { defineCachedEventHandler } from '#imports'

export default defineCachedEventHandler(async () => {
  try {
    return await $fetch('https://app.vuejobs.com/feed/nuxtjs/docs?limit=-1&format=json&filter%5Bsearch%5D=nuxt')
  } catch (e) {
    console.error({ error: e })
  }
}, {
  name: 'nuxt-jobs',
  maxAge: 60 * 1000
})
