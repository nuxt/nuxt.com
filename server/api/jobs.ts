import type { NuxtJob } from '../../types'

export default defineCachedEventHandler(async () => {
  return await $fetch<NuxtJob[]>('https://vuejobs.com/api/jobs?keyword=nuxt')
}, {
  name: 'nuxt-jobs',
  maxAge: 60 * 1000
})
