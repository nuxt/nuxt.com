import type { LinkProps } from '@nuxt/ui'

export interface Filter extends LinkProps {
  key: string | number
  title: string
  icon?: string
}
