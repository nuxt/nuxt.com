import type { ContentFile } from '@nuxt/content'
import type { Filter } from './filters'
import type { LinkProps } from '@nuxt/ui'

export interface Agency extends ContentFile {
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
  resources?: LinkProps[]
  location: Filter
}
