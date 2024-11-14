import type { ParsedContent } from '@nuxt/content'
import type { Filter } from './filters'
import type { Link } from '#ui-pro/types'

export interface Agency extends ParsedContent {
  title: string
  description: string
  fullDescription: string
  _path: string
  link: string
  twitter: string
  x: string
  github: string
  linkedin: string
  instagram: string
  logo: {
    light: string
    dark: string
  }
  regions: Filter[]
  services: Filter[]
  resources?: Link[]
  location: Filter
}
