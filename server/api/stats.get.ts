import type { Stats } from '#shared/types'

export default cachedEventHandler(async (event) => {
  const repo = await github.fetchRepo(event, 'nuxt', 'nuxt')
  const [npmData, { downloads }] = await Promise.all([
    npm.fetchPackageVersion('nuxt', 'latest'),
    npm.fetchPackageStats('nuxt')
  ])

  return {
    ...repo,
    version: npmData!.version,
    monthlyDownloads: downloads
  } satisfies Stats
}, {
  name: 'stats',
  getKey: () => 'nuxt',
  maxAge: 60 * 60 // 10 minutes
})
