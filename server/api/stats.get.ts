import type { Stats } from '#shared/types'
import type { NpmDownloadStats } from '../types/npm'
import { satisfies } from 'verkit'

// The window npm used for `last-month`, shifted back one year.
function lastMonthAYearAgo({ start, end }: NpmDownloadStats) {
  const day = 24 * 60 * 60 * 1000
  const endDate = end ? new Date(`${end}T00:00:00Z`) : new Date(Date.now() - day)
  const startDate = start ? new Date(`${start}T00:00:00Z`) : new Date(endDate.getTime() - 29 * day)
  startDate.setUTCFullYear(startDate.getUTCFullYear() - 1)
  endDate.setUTCFullYear(endDate.getUTCFullYear() - 1)
  return `${startDate.toISOString().slice(0, 10)}:${endDate.toISOString().slice(0, 10)}` as const
}

export default cachedEventHandler(async (event) => {
  const repo = await github.fetchRepo(event, 'nuxt', 'nuxt')
  const [npmData, lastMonth, modules] = await Promise.all([
    npm.fetchPackageVersion('nuxt', 'latest'),
    npm.fetchPackageStats('nuxt'),
    fetchModules(event).then(modules => modules || []).catch(() => [])
  ])
  const lastYear = await npm.fetchPackageStats('nuxt', lastMonthAYearAgo(lastMonth))
  const version = npmData!.version

  return {
    ...repo,
    version,
    monthlyDownloads: lastMonth.downloads,
    monthlyDownloadsLastYear: lastYear.downloads,
    modules: modules.filter(module => satisfies(version, module.compatibility.nuxt)).length
  } satisfies Stats
}, {
  name: 'stats',
  getKey: () => 'nuxt:v2',
  swr: true,
  maxAge: 60 * 60 // 10 minutes
})
