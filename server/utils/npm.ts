import type { NpmDownloadStats, NpmPeriod } from '../types/npm'
import type { Packument, PackumentVersion } from '@npm/types'

interface NpmBulkDownloadStats {
  [packageName: string]: NpmDownloadStats
}

export const npm = {
  async fetchPackage(name: string): Promise<Packument | null> {
    try {
      return await $fetch<Packument>(`https://registry.npmjs.org/${name}`)
    } catch (err) {
      console.error(`Cannot fetch npm info for ${name}: ${err}`)
      return null
    }
  },
  async fetchPackageVersion(name: string, version: string): Promise<PackumentVersion | null> {
    try {
      return await $fetch<PackumentVersion>(`https://registry.npmjs.org/${name}/${version}`)
    } catch (err) {
      console.error(`Cannot fetch npm version info for ${name}@${version}: ${err}`)
      return null
    }
  },
  async fetchPackageStats(name: string, period: NpmPeriod = 'last-month'): Promise<NpmDownloadStats> {
    try {
      return await $fetch<NpmDownloadStats>(`https://api.npmjs.org/downloads/point/${period}/${name}`)
    } catch (err) {
      console.error(`Cannot fetch npm downloads stats for ${name}: ${err}`)
      return { downloads: 0 }
    }
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

      try {
        const response = await $fetch<NpmBulkDownloadStats>(`https://api.npmjs.org/downloads/point/${period}/${packageList}`)

        for (const pkg of batch) {
          if (response[pkg]) {
            result[pkg] = { downloads: response[pkg].downloads }
          } else {
            result[pkg] = { downloads: 0 }
          }
        }
      } catch (err) {
        console.error(`Cannot fetch bulk npm downloads stats for batch: ${err}`)
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
