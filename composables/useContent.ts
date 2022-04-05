import { withoutTrailingSlash } from 'ufo'
import { NavItem, ParsedContent } from '@nuxt/content/dist/runtime/types'
import { findChildFromPath, findBottomLinkFromTree } from '../utils/content'

export const useContent = () => {
  const route = useRoute()

  /**
   * Navigation tree from root of app.
   */
  const navigation = useState<NavItem[]>('navigation')

  /**
   * Current page complete data.
   */
  const page = useState<ParsedContent>('content-current-page')

  /**
   * Previous and next page data.
   * Format: [previous, next]
   */
  const surround = useState<ParsedContent[]>('content-surround')

  /**
   * Table of contents from parsed page.
   */
  const toc = computed(
    () => page?.value?.body?.toc?.links || []
  )

  /**
   * Content type from parsed page.
   */
  const type = computed(() => page.value?.meta?.type)

  /**
   * Next page from `surround`.
   */
  const next = computed(
    () => surround.value?.[1] || false
  )

  /**
   * Previous page from `surround`.
   */
  const prev = computed(
    () => surround.value?.[0] || false
  )

  /**
   * Navigation fetching helper.
   */
  const fetchNavigation = async () => {
    // @ts-ignore
    navigation.value = await queryContent().findNavigation()
  }

  /**
   * Local page fetching helper.
   */
  const fetchPage = async () => {
    const currentPath = withoutTrailingSlash(route.path)
    const splitted = currentPath.split('/')
    const directory = splitted.slice(0, splitted.length - 1).join('/')

    // Get navigation node from current path
    const file = findChildFromPath(currentPath, navigation.value)

    if (file && !file.children) {
      // Path queried has a page (and is not a directory)
      await Promise.all([
        queryContent(currentPath).findOne() as Promise<ParsedContent>,
        queryContent(directory).findSurround(currentPath) as Promise<ParsedContent[]>
      ]).then(([_page, _surround]) => {
        page.value = _page
        surround.value = _surround
      })
    } else {
      // Path queried ain't a page, try to find a redirect to closest page
      try {
        const slug = findBottomLinkFromTree(file)

        return slug
      } catch (e) {}
    }
  }

  /**
   * Page list fetching helper.
   */
  const fetchDir = async (path: string) => await queryContent(path).find()

  return {
    fetchDir,
    fetchPage,
    fetchNavigation,
    navigation,
    page,
    surround,
    next,
    prev,
    type,
    toc
  }
}
