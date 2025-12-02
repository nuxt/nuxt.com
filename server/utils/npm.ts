type NpmPeriod = 'last-day' | 'last-week' | 'last-month' | 'last-year'

export const npm = {
  fetchPackage(name: string) {
    return $fetch<any>(`https://registry.npmjs.org/${name}`)
      .catch((err: Error) => {
        console.error(`Cannot fetch npm info for ${name}: ${err}`)
        return {}
      })
  },
  fetchPackageStats(name: string, period: NpmPeriod = 'last-month'): Promise<{ downloads: number }> {
    return $fetch<{ downloads: number }>(`https://api.npmjs.org/downloads/point/${period}/${name}`)
      .catch((err: Error) => {
        console.error(`Cannot fetch npm downloads stats for ${name}: ${err}`)
        return { downloads: 0 }
      })
  }
}
