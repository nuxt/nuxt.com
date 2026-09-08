import type { Filter } from './filters'
import type { LinkProps } from '@nuxt/ui'

export interface Agency {
  title: string
  description: string
  fullDescription: string
  path: string
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
