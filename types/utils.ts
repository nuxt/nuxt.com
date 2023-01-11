export interface Category {
  key: number,
  title: string,
  label?: string,
  to: { name: string, query: { category: string }, state: { smooth: string } },
  icon?: string
}
