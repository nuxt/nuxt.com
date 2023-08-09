export interface ShowcaseListGroupItem {
  createdAt: string
  description: string
  domain: string
  favicon: string
  framework: { id: number, slug: string, name: string, url: string, imgPath: string, updatedAt: string, createdAt: string }
  frameworkVersion: string
  hasSSR: boolean
  hostname: string
  id: number
  isFeatured: boolean
  isStatic: boolean
  language: string
  lastDetectedAt: string
  list_group_id: number
  position: number
  rank: string
  screenshotUrl: string
  showcase_id: number
  siteName: string
  slug: string
  title: string
  ui: string
  uiVersion: string
  updatedAt: string
  url: string
  vueVersion: string
}

export interface ShowcaseListGroup {
  created_at: string
  id: number
  name: string
  position: number
  showcases: ShowcaseListGroupItem[]
  updated_at: string
}

export interface ShowcaseList {
  created_at: string
  groups: ShowcaseListGroup[]
  id: number
  name: string
  updated_at: string
}
