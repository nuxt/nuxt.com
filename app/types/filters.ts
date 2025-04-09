import type { LinkProps } from '@nuxt/ui'

export interface Filter extends Omit<LinkProps, 'type'> {
  key: string | number
  title?: string
  label?: string
  icon?: string
}
