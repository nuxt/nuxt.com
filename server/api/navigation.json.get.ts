import { queryCollectionNavigation } from '@nuxt/content/server'
import type { NavigationItem } from 'comark-content'
import { ALL_DOCS_SOURCES } from '../../shared/utils/docs'

const VERSION_PATHS = new Set(['/docs/3.x', '/docs/4.x', '/docs/5.x'])

function versionRoots(tree: NavigationItem[]): NavigationItem[] {
  const found: NavigationItem[] = []
  const walk = (items: NavigationItem[]) => {
    for (const item of items) {
      if (VERSION_PATHS.has(item.path)) {
        found.push(item)
        continue
      }
      if (item.children?.length) walk(item.children)
    }
  }
  walk(tree)
  return found
}

export default defineEventHandler(async (event) => {
  const [docs, blog] = await Promise.all([
    content.navigation([...ALL_DOCS_SOURCES]),
    queryCollectionNavigation(event, 'blog')
  ])

  return [...versionRoots(docs), ...(blog ?? [])].filter(Boolean)
})
