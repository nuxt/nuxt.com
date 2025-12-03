export interface NpmDownloadStats {
  downloads: number
  start?: string
  end?: string
  package?: string
}

export type NpmPeriod = 'last-day' | 'last-week' | 'last-month' | 'last-year'
