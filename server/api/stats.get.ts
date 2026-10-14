import type { Stats } from '#shared/types'
import { satisfies } from 'verkit'

// The same 30-day window as npm's `last-month`, shifted back one year.
function lastMonthAYearAgo() {
  const day = 24 * 60 * 60 * 1000
  const end = new Date(Date.now() - day)
  end.setUTCFullYear(end.getUTCFullYear() - 1)
  const start = new Date(end.getTime() - 29 * day)
  return `${start.toISOString().slice(0, 10)}:${end.toISOString().slice(0, 10)}` as const
}

export default cachedEventHandler(async (event) => {
  const repo = await github.fetchRepo(event, 'nuxt', 'nuxt')
  const [npmData, { downloads }, { downloads: downloadsLastYear }, modules] = await Promise.all([
    npm.fetchPackageVersion('nuxt', 'latest'),
    npm.fetchPackageStats('nuxt'),
    npm.fetchPackageStats('nuxt', lastMonthAYearAgo()),
    fetchModules(event).then(modules => modules || []).catch(() => [])
  ])

  return {
    ...repo,
    version: npmData!.version,
    monthlyDownloads: downloads,
    monthlyDownloadsLastYear: downloadsLastYear,
    modules: modules.filter(module => satisfies('3.999.999', module.compatibility.nuxt)).length
  } satisfies Stats
}, {
  name: 'stats',
  getKey: () => 'nuxt:v2',
  swr: true,
  maxAge: 60 * 60 // 10 minutes
})
