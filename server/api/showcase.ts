import type { ShowcasesList } from '~/types'

export default cachedEventHandler(() => {
  return $fetch<ShowcasesList>('https://api.vuetelescope.com/lists/505')
}, {
  name: 'nuxt-showcase',
  maxAge: 60 * 1000
})
