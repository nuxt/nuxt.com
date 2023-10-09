export default cachedEventHandler(async (event) => {
  const repo = await github.fetchRepo('nuxt', 'nuxt')
  const { downloads} = await npm.fetchPackageStats('nuxt')

  return {
    ...repo,
    monthlyDownloads: downloads
  }
}, {
  name: 'stats',
  getKey: () => 'nuxt',
  maxAge: 60 * 60 // 10 minutes
})