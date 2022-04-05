import type { Ref } from 'vue'
import { withoutTrailingSlash } from 'ufo'
import type { NavItem, ParsedContent } from '@nuxt/content/dist/runtime/types'

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

/**
 * Fetching helper to avoid having two different logics between plugin (HMR) and middleware (SSR).
 */
export const fetchContent = (path: string, navigation: Ref<NavItem[]>, page: Ref<ParsedContent>, surround: Ref<ParsedContent[]>) => {
  path = withoutTrailingSlash(path)
  const splitted = path.split('/')
  const directory = splitted.slice(0, splitted.length - 1).join('/')

  const file = findChildFromPath(path, navigation.value)

  if (file && !file.children) {
    return Promise.all([
      queryContent(path).findOne() as Promise<ParsedContent>,
      queryContent(directory).findSurround(path) as Promise<ParsedContent[]>
    ]).then(([_page, _surround]) => {
      page.value = _page
      surround.value = _surround
    })
  } else {
    try {
      // Redirect as the current path is not a page
      const slug = findBottomLinkFromTree(file)

      return slug
    } catch (e) {}
  }
}
