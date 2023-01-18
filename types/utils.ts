export interface FilterItem {
  key: string
  title: string
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
