import type { NpmJsDownloadsRange } from '~/types'

export default defineCachedEventHandler((event) => {
  const { range = 'month' } = event.context.params
  if (!['month', 'week'].includes(range)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid range argument'
    })
  }

  return $fetch<NpmJsDownloadsRange>(`https://api.npmjs.org/downloads/range/last-${range}/nuxt`)
}, {
  name: 'downloads-range',
  maxAge: 60 * 1000
})
