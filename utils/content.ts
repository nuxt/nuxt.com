import type { NavItem } from '@nuxt/content/dist/runtime/types'

export const _find = (
  items: NavItem[],
  id: string,
  tree: NavItem[] = [],
  condition: (node: NavItem) => boolean
): { found?: NavItem; tree: NavItem[] } => {
  for (const item of items) {
    if (condition(item)) { return { found: item, tree } }

    if (item.children) {
      const result = _find(item.children, id, [...tree, item], condition)

      if (result.found) { return result }
    }
  }

  return { tree }
}

export const findElement = (
  items: NavItem[],
  id: string,
  tree: NavItem[] = [],
  condition = (node: NavItem) => node.id === id || node.slug === id
) => _find(items, id, tree, condition)

export const findChildFromPath = (slug, tree) => {
  for (const file of tree) {
    if (file.slug === slug) {
      return file
    }
    if (file.children) {
      const result = findChildFromPath(slug, file.children)
      if (result) { return result }
    }
  }
}

export const findBottomLinkFromTree = (link) => {
  let slug = link.slug

  if (link.children && link.children.length) {
    slug = findBottomLinkFromTree(link.children[0])
  }

  return slug
}
