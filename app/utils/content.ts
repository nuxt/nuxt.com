import type { ContentNavigationItem, DocsCollectionItem } from '@nuxt/content'

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

export function findTitleTemplate(page: Ref<DocsCollectionItem>, navigation: Ref<ContentNavigationItem[]>): string {
  if (!page.value) {
    return ''
  }

  if (page.value.titleTemplate) {
    return page.value.titleTemplate
  }

  // If titleTemplate is not set, we check the navigation for the closest parent with a titleTemplate
  const parts = page.value.path.split('/')
  const items = []
  let current = navigation.value
  for (let index = 1; index < parts.length; index += 1) {
    const prefix = parts.slice(0, index + 1).join('/')
    const node = current.find(item => item.path === prefix)

    if (!node) {
      break
    }

    current = node.children
    items.unshift(node)
  }

  return items.find(item => typeof item.titleTemplate === 'string')?.titleTemplate || '%s · Nuxt'
}
