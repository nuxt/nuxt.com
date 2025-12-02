import type { NpmDownloadStats, NpmPeriod } from '../types/npm'
import type { Packument, PackumentVersion } from '@npm/types'

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
  }
}
