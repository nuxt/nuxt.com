import type { CommunityJob } from '~/types'

export default defineCachedEventHandler(async () => {
  return await $fetch<CommunityJob[]>('https://vuejobs.com/api/jobs?keyword=nuxt')
}, {
  name: 'community-jobs',
  maxAge: 60 * 1000
})
