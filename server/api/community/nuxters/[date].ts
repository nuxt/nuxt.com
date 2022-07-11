import type { CommunityNuxter } from '~/types'

const config = useRuntimeConfig()

export default defineCachedEventHandler(async (event) => {
  const date = event.context.params.date

  const nuxters = await $fetch<CommunityNuxter[]>('https://api.volta.net/users/activities', {
    headers: {
      token: config.volta.token
    },
    params: {
      organizations: ['nuxt', 'nuxt-community', 'nuxt-themes', 'nuxtlabs', 'unjs'],
      date
    }
  })

  return nuxters
}, {
  name: 'community-nuxters',
  maxAge: 60 * 1000
})
