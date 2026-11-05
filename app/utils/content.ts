import type { NavigationItem } from 'comark-content'
import type { AvatarProps, ButtonProps, PageFeatureProps, UserProps } from '@nuxt/ui'

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

/**
 * Every document under the `path` directory (at any depth).
 */
export async function listByDir<T extends Record<string, any> = Record<string, any>>(path: string) {
  const items = await useContent('site').list()
  const prefix = `${path}/`

  return items
    .filter(item => item.path.startsWith(prefix) && !item.path.split('/').pop()!.startsWith('.'))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(item => ({ ...(item.data as T), path: item.path, stem: item.meta.stem, extension: item.meta.extension }))
}

export interface ListSurroundLink {
  title: string
  description?: string
  path: string
  [key: string]: unknown
}

/**
 * Previous and next entry around `path` in an already-sorted list
 */
export function listSurround(
  items: Array<Record<string, any>> | undefined | null,
  path: string
): Array<ListSurroundLink | null> {
  const index = (items ?? []).findIndex(item => item.path === path)
  if (index === -1) return []

  const link = (item?: Record<string, any>): ListSurroundLink | null =>
    item ? { title: item.title, description: item.description, path: item.path } : null

  return [link(items?.[index - 1]), link(items?.[index + 1])]
}

/**
 * Content data reaches components through these picks, never a `v-bind` spread.
 * - Vue binds every unknown key to the DOM, so a spread lets content set any attribute.
 * - Nuxt UI spreads each `links` item onto a `UButton`, each `authors` item onto a `UUser`…
 * Keys are the ones content uses: add one here before content can set it.
 */

type ContentObject = Record<string, any> | null | undefined

function pick<T>(data: ContentObject, keys: readonly string[]): T {
  const picked: Record<string, unknown> = {}
  for (const key of keys) {
    if (data?.[key] !== undefined) picked[key] = data[key]
  }
  return picked as T
}

const AVATAR_KEYS = ['src', 'srcset', 'alt', 'text', 'icon', 'provider', 'loading']
const LINK_KEYS = ['label', 'to', 'target', 'title', 'icon', 'leadingIcon', 'trailingIcon', 'trailing', 'color', 'variant', 'size', 'download', 'external']
const FEATURE_KEYS = ['title', 'description', 'icon', 'to', 'target']
const USER_KEYS = ['name', 'description', 'to', 'target']

export function pickAvatar(avatar: ContentObject): AvatarProps | undefined {
  return avatar ? pick<AvatarProps>(avatar, AVATAR_KEYS) : undefined
}

export function pickLink(link: ContentObject): ButtonProps {
  const picked = pick<ButtonProps>(link, LINK_KEYS)
  if (link?.avatar) picked.avatar = pickAvatar(link.avatar)
  return picked
}

/** `undefined` stays `undefined`, so components still skip an absent `links`. */
export function pickLinks(links: ContentObject[] | null | undefined): ButtonProps[] | undefined {
  return links?.map(pickLink)
}

export function pickFeature(feature: ContentObject): PageFeatureProps {
  return pick<PageFeatureProps>(feature, FEATURE_KEYS)
}

export function pickUser(user: ContentObject): UserProps {
  const picked = pick<UserProps>(user, USER_KEYS)
  if (user?.avatar) picked.avatar = pickAvatar(user.avatar)
  return picked
}
