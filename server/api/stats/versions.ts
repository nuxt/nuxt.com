import type { NpmJsVersions } from '~/types'

export default defineCachedEventHandler(() => {
  return $fetch<NpmJsVersions>('https://api.npmjs.org/versions/nuxt/last-week')
}, {
  name: 'versions',
  maxAge: 60 * 1000
})
