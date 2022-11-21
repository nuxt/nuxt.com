import type { NuxtJob } from '../../types'
import { defineCachedEventHandler } from '#imports'

export default defineCachedEventHandler(async () => {
  return await $fetch<NuxtJob[]>('https://vuejobs.com/api/jobs?keyword=nuxt')
}, {
  name: 'nuxt-jobs',
  maxAge: 60 * 1000
})
