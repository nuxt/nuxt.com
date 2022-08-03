export interface NpmJsDownloadsPoint {
  start: string
  end: string
  package: string
  downloads: number
}

export interface NpmJsDownloadsRange {
  start: string
  end: string
  package: string
  downloads: Array<{ downloads: number, day: string }>
}

export interface NpmJsVersions {
  package: string
  downloads: { [key: string]: number }
}
