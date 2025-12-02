interface NpmPackageInfo {
  version?: string
}

export default cachedEventHandler(async (event) => {
  const repo = await github.fetchRepo(event, 'nuxt', 'nuxt')
  const npmData = await $fetch<NpmPackageInfo>('https://registry.npmjs.org/nuxt/latest').catch((): NpmPackageInfo => ({}))
  const { downloads } = await npm.fetchPackageStats('nuxt')

  return {
    ...repo,
    version: npmData.version,
    monthlyDownloads: downloads
  }
}, {
  name: 'stats',
  getKey: () => 'nuxt',
  maxAge: 60 * 60 // 10 minutes
})
