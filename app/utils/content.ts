export interface NavNode {
  title: string
  path: string
  stem?: string
  description?: string
  titleTemplate?: string | null
  children?: NavNode[]
  page?: false
  [key: string]: unknown
}

export function navPageFromPath(path: string, tree: NavNode[]): NavNode | undefined {
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

export function findPageBreadcrumb(tree: NavNode[], path: string): NavNode[] {
  for (const item of tree) {
    if (item.path === path) {
      return [item]
    }
    if (item.children?.length) {
      const nested = findPageBreadcrumb(item.children, path)
      if (nested.length) {
        return [item, ...nested]
      }
    }
  }
  return []
}

export function flattenNavPages(tree: NavNode[]): NavNode[] {
  const pages: NavNode[] = []
  for (const item of tree) {
    if (item.page !== false && item.path) {
      pages.push(item)
    }
    if (item.children?.length) {
      pages.push(...flattenNavPages(item.children))
    }
  }
  return pages
}

function cleanV4Path(path: string): string {
  return path.replace(/\/\d\.x(?=\/|$)/, '')
}

function cleanNavigationPaths(navigation: NavNode[], isV4: boolean): NavNode[] {
  return navigation.map(item => ({
    ...item,
    path: item.path ? cleanV4Path(item.path) : item.path,
    children: item.children ? cleanNavigationPaths(item.children, isV4) : undefined
  }))
}

export function findTitleTemplate(
  pagePath: string | undefined,
  pageTitleTemplate: string | undefined,
  navigation: NavNode[],
  versionPath: string
): string {
  if (!pagePath) {
    return '%s · Nuxt'
  }

  if (pageTitleTemplate) {
    return pageTitleTemplate
  }

  const isV4 = versionPath === '/docs/4.x'
  const searchPath = cleanV4Path(pagePath)
  const cleanNavigation = cleanNavigationPaths(navigation, isV4)

  const parts = searchPath.split('/')
  const items: NavNode[] = []
  let current: NavNode[] | undefined = cleanNavigation

  for (let index = 1; index < parts.length; index += 1) {
    const prefix = parts.slice(0, index + 1).join('/')
    const node = current?.find(item => item.path === prefix)

    if (!node) break

    current = node.children
    items.unshift(node)
  }

  return items.find(item => typeof item.titleTemplate === 'string')?.titleTemplate || '%s · Nuxt'
}
