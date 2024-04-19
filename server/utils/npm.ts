type NpmPeriod = 'last-day' | 'last-week' | 'last-month' | 'last-year'

export const npm = {
  fetchPackage(name: string) {
    return $fetch<any>(`https://registry.npmjs.org/${name}`)
      .catch((err) => {
        console.error(`Cannot fetch npm info for ${name}: ${err}`)
        return {}
      })
  },
  fetchPackageStats(name: string, period: NpmPeriod = 'last-month') {
    return $fetch<any>(`https://api.npmjs.org/downloads/point/${period}/${name}`)
      .catch((err) => {
        console.error(`Cannot fetch npm downloads stats for ${name}: ${err}`)
        return { downloads: 0 }
      })
  }
}
