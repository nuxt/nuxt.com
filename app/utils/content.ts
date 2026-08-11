import type { ContentNavigationItem } from '../../shared/types/content'

export type { ContentNavigationItem, DocsPageData } from '../../shared/types/content'

/**
 * Surroundings (prev/next) for a path within an ordered list of items.
 */
export function itemSurroundings<T extends { path: string }>(
  items: T[],
  path: string
): [T | null, T | null] {
  const index = items.findIndex(item => item.path === path)
  if (index === -1) return [null, null]
  return [
    index > 0 ? items[index - 1]! : null,
    index < items.length - 1 ? items[index + 1]! : null
  ]
}

export function navPageFromPath(path: string, tree: ContentNavigationItem[]): ContentNavigationItem | undefined {
  for (const file of tree) {
    if (file.path === path) {
      return file
    }

    if (file.children) {
      const result = navPageFromPath(path, file.children)
      if (result) {
        return result
      }
    }
  }
}

function cleanV4Path(path: string): string {
  return path.replace(/\/\d\.x(?=\/|$)/, '')
}

function cleanNavigationPaths(navigation: ContentNavigationItem[]): ContentNavigationItem[] {
  return navigation.map(item => ({
    ...item,
    path: cleanV4Path(item.path),
    children: item.children ? cleanNavigationPaths(item.children) : undefined
  }))
}

export function findTitleTemplate(
  page: Ref<{ path: string, data: { titleTemplate?: string } } | null | undefined>,
  navigation: Ref<ContentNavigationItem[]>,
  _versionPath: string
): string {
  if (!page.value?.path) {
    return '%s · Nuxt'
  }

  if (page.value.data?.titleTemplate) {
    return page.value.data.titleTemplate
  }

  const searchPath = cleanV4Path(page.value.path)
  const cleanNavigation = cleanNavigationPaths(navigation.value)

  const parts = searchPath.split('/')
  const items = []
  let current = cleanNavigation

  for (let index = 1; index < parts.length; index += 1) {
    const prefix = parts.slice(0, index + 1).join('/')
    const node = current.find(item => item.path === prefix)

    if (!node) break

    current = node.children || []
    items.unshift(node)
  }

  return items.find(item => typeof item.titleTemplate === 'string')?.titleTemplate || '%s · Nuxt'
}

/**
 * Breadcrumb trail for a path in a navigation tree (replacement for @nuxt/content/utils findPageBreadcrumb).
 */
export function findPageBreadcrumb(
  navigation: ContentNavigationItem[],
  path: string
): ContentNavigationItem[] {
  const parts = path.split('/').filter(Boolean)
  const breadcrumb: ContentNavigationItem[] = []
  let current = navigation

  for (let index = 0; index < parts.length; index++) {
    const prefix = `/${parts.slice(0, index + 1).join('/')}`
    const node = current.find(item => item.path === prefix)
    if (!node) break
    breadcrumb.push(node)
    current = node.children || []
  }

  return breadcrumb
}
