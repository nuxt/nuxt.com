import { withoutTrailingSlash } from 'ufo'
import type { NavItem, ParsedContent } from '@nuxt/content/dist/runtime/types'

export const usePage = () => {
  const route = useRoute()

  const path = computed(() => withoutTrailingSlash(route.path))

  /**
   * Navigation tree from root of app.
   */
  const navigation = useState<NavItem[]>('navigation', () => null)

  /**
   * Current page complete data.
   */
  const page = useState<ParsedContent>(`content-page-${path.value}`, () => null)

  /**
   * Previous and next page data.
   * Format: [prev, next]
   */
  const surround = useState<ParsedContent[]>(`content-surround-${path.value}`, () => null)

  /**
   * Table of contents from parsed page.
   */
  const toc = computed(() => page?.value?.body?.toc?.link as { id: string, text: string }[] || [])

  /**
   * Content type from parsed page.
   */
  const type = computed(() => page.value?.meta?.type as string)

  /**
   * Next page from `surround`.
   */
  const next = computed(() => surround.value?.[1] || null)

  /**
   * Previous page from `surround`.
   */
  const prev = computed(() => surround.value?.[0] || null)

  /**
   * Navigation fetching helper.
   */
  const fetchNavigation = async ({ force = false }: { force?: boolean } = {}) => {
    if (navigation.value !== null && !force) { return }

    // @ts-ignore
    navigation.value = await fetchContentNavigation()
  }

  /**
   * Local page fetching helper.
   */
  const fetchPage = async ({ force = false, querySurround = false, _path = null }: { force?: boolean, querySurround?: boolean, _path?: string } = {}) => {
    if (page.value !== null && !force) { return }

    try {
      const [_page, _surround] = await Promise.all([
        queryContent().where({ _path: _path || path.value }).findOne() as Promise<ParsedContent>,
        querySurround && queryContent()
          .where({ _partial: { $not: true }, navigation: { $not: false } })
          .findSurround(_path || path.value) as Promise<ParsedContent[]>
      ])

      page.value = _page
      surround.value = _surround
    } catch (e) {
      throwError({ statusMessage: 'Page not found', message: 'This page does not exist.', statusCode: 404 })
    }
  }

  /**
   * Page list fetching helper.
   */
  const fetchDir = async (path: string) => await queryContent(path).find()

  /**
   * Find first child link from a navigation node.
   */
  const findBottomLink = (link: NavItem) => {
    if (!link.children) { return link._path }

    for (const child of link.children) {
      if (!child.children) {
        return child._path
      }
    }

    for (const child of link.children) {
      const result = findBottomLink(child)
      if (result) {
        return result
      }
    }
  }

  /**
   * Find current navigation node from a path.
   */
  const navFromPath = (path: string, tree: NavItem[] = navigation.value || []) => {
    for (const file of tree) {
      if (file._path === path && !file.id) {
        return file
      }

      if (file.children) {
        const result = navFromPath(path, file.children)
        if (result) { return result }
      }
    }
  }

  // const fileFromPath = (path: string, tree: NavItem[] = navigation.value) => {
  //   for (const file of tree) {
  //     if (file.children) {
  //       const result = fileFromPath(path, file.children)
  //       if (result) { return result }
  //     }

  //     if (file._path === path) {
  //       return file
  //     }
  //   }
  // }

  return {
    // useState references
    navigation,
    page,
    surround,
    // Fetching helpers
    fetchDir,
    fetchPage,
    fetchNavigation,
    // Computed values
    next,
    prev,
    type,
    toc,
    // Methods
    navFromPath,
    findBottomLink
  }
}
