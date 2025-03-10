import type { LinkProps } from '@nuxt/ui'

export interface Filter extends LinkProps {
  key: string | number
  title?: string
  label?: string
  icon?: string
}
