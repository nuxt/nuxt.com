import type { ContentNavigationItem, Docsv3CollectionItem, Docsv4CollectionItem } from '@nuxt/content'

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
  return path.replace('/4.x/', '/').replace(/\/4\.x$/, '')
}

function cleanNavigationPaths(navigation: ContentNavigationItem[], isV4: boolean): ContentNavigationItem[] {
  if (!isV4) return navigation

  return navigation.map(item => ({
    ...item,
    path: item.path ? cleanV4Path(item.path) : item.path,
    children: item.children ? cleanNavigationPaths(item.children, isV4) : undefined
  }))
}

export function findTitleTemplate(page: Ref<Docsv3CollectionItem | Docsv4CollectionItem>, navigation: Ref<ContentNavigationItem[]>): string {
  if (!page.value?.path) {
    return '%s · Nuxt'
  }

  if (page.value.titleTemplate) {
    return page.value.titleTemplate
  }

  const { version } = useDocsVersion()
  const isV4 = version.value.path === '/docs/4.x'
  const searchPath = isV4 ? cleanV4Path(page.value.path) : page.value.path
  const cleanNavigation = cleanNavigationPaths(navigation.value, isV4)

  const parts = searchPath.split('/')
  const items = []
  let current = cleanNavigation

  for (let index = 1; index < parts.length; index += 1) {
    const prefix = parts.slice(0, index + 1).join('/')
    const node = current.find(item => item.path === prefix)

    if (!node) break

    current = node.children
    items.unshift(node)
  }

  return items.find(item => typeof item.titleTemplate === 'string')?.titleTemplate || '%s · Nuxt'
}
