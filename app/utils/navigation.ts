import type { NavigationItem } from 'comark-content'

export interface BreadcrumbItem {
  title: string
  path?: string
}

/** Trail of navigation items leading to `path`, including the page itself. */
export function findBreadcrumb(
  navigation: NavigationItem[] | undefined | null,
  path: string | undefined
): BreadcrumbItem[] {
  if (!navigation?.length || !path) return []

  const trail: BreadcrumbItem[] = []

  const visit = (items: NavigationItem[]): boolean => {
    for (const item of items) {
      trail.push({ title: item.title, path: item.page === false ? undefined : item.path })
      if (item.path === path && item.page !== false) return true
      if (item.children?.length && visit(item.children)) return true
      trail.pop()
    }
    return false
  }

  return visit(navigation) ? trail : []
}

export interface SurroundLink {
  title: string
  description?: string
  path: string
  /** `UContentSurround` types items as an open record. */
  [key: string]: unknown
}

/** The previous and next page around `path`, flattening the navigation in reading order. */
export function findSurroundLinks(
  navigation: NavigationItem[] | undefined | null,
  path: string | undefined
): Array<SurroundLink | null> {
  if (!navigation?.length || !path) return []

  const flat: SurroundLink[] = []

  const collect = (items: NavigationItem[]) => {
    for (const item of items) {
      // A directory `index.md` is emitted twice — keep the child, else "next" points at self.
      const selfIndexed = item.children?.some(child => child.path === item.path)
      if (item.page !== false && !selfIndexed) {
        flat.push({ title: item.title, description: item.description, path: item.path })
      }
      if (item.children?.length) collect(item.children)
    }
  }
  collect(navigation)

  const index = flat.findIndex(item => item.path === path)
  if (index === -1) return []

  return [flat[index - 1] || null, flat[index + 1] || null]
}

/** Title of the top-level section a page belongs to, used as the page headline. */
export function findPageHeadline(
  navigation: NavigationItem[] | undefined | null,
  path: string | undefined
): string | undefined {
  if (!navigation?.length || !path) return undefined

  const contains = (items: NavigationItem[]): boolean =>
    items.some(item => item.path === path || (item.children?.length ? contains(item.children) : false))

  for (const item of navigation) {
    if (item.children?.length && contains(item.children)) return item.title
  }
}
