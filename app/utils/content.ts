import type { NavigationItem } from 'comark-content'

export function navPageFromPath(path: string, tree: NavigationItem[]): NavigationItem | undefined {
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

function cleanVersionPath(path: string): string {
  return path.replace(/\/\d\.x(?=\/|$)/, '')
}

function cleanNavigationPaths(navigation: NavigationItem[]): NavigationItem[] {
  return navigation.map(item => ({
    ...item,
    path: item.path ? cleanVersionPath(item.path) : item.path,
    children: item.children ? cleanNavigationPaths(item.children) : undefined
  }))
}

export function findTitleTemplate(
  page: Ref<{ path?: string, data?: Record<string, unknown> } | null | undefined>,
  navigation: Ref<NavigationItem[]>,
  _versionPath: string
): string {
  if (!page.value?.path) {
    return '%s · Nuxt'
  }

  const pageTemplate = page.value.data?.titleTemplate
  if (typeof pageTemplate === 'string') {
    return pageTemplate
  }

  const searchPath = cleanVersionPath(page.value.path)
  const cleanNavigation = cleanNavigationPaths(navigation.value ?? [])

  const parts = searchPath.split('/')
  const items: NavigationItem[] = []
  let current: NavigationItem[] | undefined = cleanNavigation

  for (let index = 1; index < parts.length; index += 1) {
    const prefix = parts.slice(0, index + 1).join('/')
    const node = current?.find(item => item.path === prefix)

    if (!node) break

    current = node.children
    items.unshift(node)
  }

  return items.find(item => typeof item.titleTemplate === 'string')?.titleTemplate as string || '%s · Nuxt'
}
