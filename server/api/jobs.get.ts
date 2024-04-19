export default cachedEventHandler(async () => {
  try {
    const { data } = await $fetch('https://app.vuejobs.com/feed/nuxtjs/docs?limit=-1&format=json&filter%5Bsearch%5D=nuxt')

    return data
  }
  catch (e) {
    console.error({ error: e })
  }
}, {
  name: 'nuxt-jobs',
  getKey: () => 'jobs',
  maxAge: 60 * 10 // 10 minutes
})
