import type { NpmDownloadStats, NpmPeriod } from '../types/npm'
import type { Packument, PackumentVersion } from '@npm/types'

interface NpmBulkDownloadStats {
  [packageName: string]: NpmDownloadStats
}

const maxRetries = 5
const initialDelay = 1000 // 1 second
const maxDelay = 30000 // 30 seconds
const backoffMultiplier = 2

async function npmFetch<T>(url: string): Promise<T | null> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await $fetch<T>(url, { headers }) as T
    } catch (err: any) {
      lastError = err

      console.log(err, err?.status, err?.statusCode)

      // Check if it's a rate limit error (429) or server error (5xx)
      const isRateLimited = err?.status === 429 || err?.statusCode === 429
      const isServerError = err?.status >= 500 || err?.statusCode >= 500

      if (!isRateLimited && !isServerError) {
        throw err
      }

      if (attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt), maxDelay)
        console.warn(`Rate limited or server error for ${url}. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`Failed to fetch ${url} after ${maxRetries} retries: ${lastError}`)

  return null
}

export const npm = {
  async fetchPackage(name: string): Promise<Packument | null> {
    return await npmFetch<Packument>(`https://registry.npmjs.org/${name}`)
  },
  async fetchPackageVersion(name: string, version: string): Promise<PackumentVersion | null> {
    return await npmFetch<PackumentVersion>(`https://registry.npmjs.org/${name}/${version}`)
  },
  async fetchPackageStats(name: string, period: NpmPeriod = 'last-month'): Promise<NpmDownloadStats> {
    const kv = useStorage('kv')
    const key = `npm-stats:${name}:${period}`
    if (await kv.get(key)) {
      return await kv.get(key) as NpmDownloadStats
    }
    const result = await npmFetch<NpmDownloadStats>(`https://api.npmjs.org/downloads/point/${period}/${name}`)
    if (result) {
      await kv.set(key, result, { ttl: 60 * 60 * 24 }) // cache for 1 day
      return result
    }
    return { downloads: 0 }
  },
  // https://github.com/npm/registry/blob/main/docs/download-counts.md#bulk-queries
  async fetchBulkPackageStats(packages: string[], period: NpmPeriod = 'last-month'): Promise<NpmBulkDownloadStats> {
    // scoped packages are not supported in bulk queries
    const nonScopedPackages = packages.filter(pkg => !pkg.startsWith('@'))
    const scopedPackages = packages.filter(pkg => pkg.startsWith('@'))

    const result: NpmBulkDownloadStats = {}

    // bulk queries are limited to 128 packages at a time
    const batchSize = 128
    for (let i = 0; i < nonScopedPackages.length; i += batchSize) {
      const batch = nonScopedPackages.slice(i, i + batchSize)
      const packageList = batch.join(',')

      const response = await npmFetch<NpmBulkDownloadStats>(`https://api.npmjs.org/downloads/point/${period}/${packageList}`)

      if (response) {
        for (const pkg of batch) {
          if (response[pkg]) {
            result[pkg] = { downloads: response[pkg].downloads }
          } else {
            result[pkg] = { downloads: 0 }
          }
        }
      } else {
        // Set downloads to 0 for failed batch
        for (const pkg of batch) {
          result[pkg] = { downloads: 0 }
        }
      }
    }

    // Fetch scoped packages individually (not supported in bulk queries)
    for (const pkg of scopedPackages) {
      result[pkg] = await this.fetchPackageStats(pkg, period)
    }

    return result
  }
}

const headers = {
  'user-agent': 'nuxt-api'
}
