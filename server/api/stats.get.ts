export default cachedEventHandler(async (event) => {
  const repo = await github.fetchRepo('nuxt', 'nuxt')
  const { version } = await $fetch<any>('https://registry.npmjs.org/nuxt/latest').catch(() => {})
  const { downloads } = await npm.fetchPackageStats('nuxt')

  return {
    ...repo,
    version,
    monthlyDownloads: downloads
  }
}, {
  name: 'stats',
  getKey: () => 'nuxt',
  maxAge: 60 * 60 // 10 minutes
})