export interface FilterItem {
  key: string | number
  title: string
  label?: string
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
