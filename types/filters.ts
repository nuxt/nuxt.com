export interface Filter {
  key: string | number
  label: string
  disabled?: boolean
  icon?: string
  to?: {
    name: string
    query: Record<string|number, unknown>
    state: {
      smooth: string
    }
  }
}
