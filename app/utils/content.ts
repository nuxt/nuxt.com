import type { ContentFile, ContentListFile } from 'comark-content'
import type { Toc } from 'comark/plugins/toc'
import type { ContentNavigationItem, SitePage } from '../../shared/types/content'

export type { ContentNavigationItem, SitePage }

type ContentLike = ContentFile | ContentListFile

/**
 * Adapt a Comark ContentFile into the flattened page shape site templates expect.
 */
export function toSitePage<T extends Record<string, any> = Record<string, any>>(
  file: ContentLike | null | undefined
): SitePage<T> | null {
  if (!file) return null

  const data = (file.data || {}) as T
  const meta = file.meta || {} as ContentFile['meta']
  const nodes = 'nodes' in file && Array.isArray(file.nodes) ? file.nodes : []
  const toc = (meta as { toc?: Toc }).toc

  return {
    ...data,
    path: file.path,
    stem: meta.stem || file.path.replace(/^\//, ''),
    extension: (meta.extension || '.md').replace(/^\./, ''),
    title: (data as { title?: string }).title,
    description: (data as { description?: string }).description,
    seo: (data as { seo?: SitePage['seo'] }).seo,
    body: toc ? { toc } : undefined,
    nodes,
    document: {
      nodes,
      frontmatter: data,
      meta: meta as Record<string, unknown>
    }
  }
}

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

function cleanNavigationPaths(navigation: ContentNavigationItem[], _isV4: boolean): ContentNavigationItem[] {
  return navigation.map(item => ({
    ...item,
    path: item.path ? cleanV4Path(item.path) : item.path,
    children: item.children ? cleanNavigationPaths(item.children, _isV4) : undefined
  }))
}

export function findTitleTemplate(
  page: Ref<{ path?: string, titleTemplate?: string } | null | undefined>,
  navigation: Ref<ContentNavigationItem[]>,
  versionPath: string
): string {
  if (!page.value?.path) {
    return '%s · Nuxt'
  }

  if (page.value.titleTemplate) {
    return page.value.titleTemplate
  }

  const isV4 = versionPath === '/docs/4.x'
  const searchPath = cleanV4Path(page.value.path)
  const cleanNavigation = cleanNavigationPaths(navigation.value, isV4)

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

/**
 * Map Comark navigation items into the shape Nuxt UI expects (title → label via mapContentNavigation).
 * Attach titleTemplate from nested data when present on the item.
 */
export function normalizeNavigation(items: ContentNavigationItem[] | null | undefined): ContentNavigationItem[] {
  if (!items?.length) return []
  return items.map(item => ({
    ...item,
    title: item.title,
    path: item.path,
    children: item.children ? normalizeNavigation(item.children) : undefined
  }))
}
