import type { ParsedContent } from '@nuxt/content/dist/runtime/types'
import type { Filter } from './filters'

export interface Agency extends ParsedContent {
  title: string
  description: string
  _path: string
  logo: {
    light: string
    dark: string
  }
  regions: Filter[]
  services: Filter[]
  location: Filter
}
