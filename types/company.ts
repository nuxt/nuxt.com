import { ParsedContent } from '@nuxt/content/dist/runtime/types'

export interface CompanyOffer extends ParsedContent {
  department: string
  location: string
  _path: string
  role: string
  badgeClass: string
  frequency: string
}

export interface CompanyContact {
  title: string
  icon: string
  description: string
  to: string
}

export interface CompanySupportAuthor {
  name: string
  job: string
  image: string
}
